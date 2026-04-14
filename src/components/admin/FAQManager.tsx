import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useSupabaseFAQ, FAQ } from '@/hooks/useSupabaseFAQ';
import { useToast } from '@/hooks/use-toast';
import { runFAQMigration } from '@/utils/migrateFAQData';
import { Download } from 'lucide-react';
import FAQList from './FAQList';
import FAQForm from './FAQForm';
import { FEATURES } from '@/config/featureFlags';

const FAQManager: React.FC = () => {
  const { createFAQ, updateFAQ, deleteFAQ, hardDeleteFAQ, toggleFAQActive, getAllFAQsForAdmin } = useSupabaseFAQ();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | undefined>();
  const [deletingFAQId, setDeletingFAQId] = useState<string | null>(null);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [showMigrationConfirm, setShowMigrationConfirm] = useState(false);
  const { toast } = useToast();

  const loadFAQs = async () => {
    setLoading(true);
    const data = await getAllFAQsForAdmin();
    setFaqs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadFAQs();
  }, []);

  const handleSubmit = async (data: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingFAQ) {
      await updateFAQ(editingFAQ.id, data);
    } else {
      await createFAQ(data);
    }
    
    setIsFormOpen(false);
    setEditingFAQ(undefined);
    loadFAQs();
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingFAQ(undefined);
    setIsFormOpen(true);
  };

  const handleHardDelete = async (id: string) => {
    setDeletingFAQId(id);
  };

  const confirmHardDelete = async () => {
    if (deletingFAQId) {
      await hardDeleteFAQ(deletingFAQId);
      setDeletingFAQId(null);
      loadFAQs();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await toggleFAQActive(id, isActive);
    loadFAQs();
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingFAQ(undefined);
  };

  const handleMigration = async () => {
    setShowMigrationConfirm(false);
    setMigrationLoading(true);
    const result = await runFAQMigration();
    
    if (result.success) {
      toast({
        title: "Migracja zakończona",
        description: `Przeniesiono ${result.count} pytań FAQ do bazy danych`,
      });
      loadFAQs();
    } else {
      toast({
        title: "Błąd migracji",
        description: "Nie udało się przenieść danych FAQ",
        variant: "destructive",
      });
    }
    setMigrationLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Zarządzanie FAQ</CardTitle>
              <CardDescription>
                Dodawaj, edytuj i zarządzaj pytaniami FAQ w różnych językach
              </CardDescription>
            </div>
            {FEATURES.SHOW_FAQ_MIGRATION && (
              <Button
                onClick={() => setShowMigrationConfirm(true)}
                disabled={migrationLoading}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>{migrationLoading ? 'Migracja...' : 'Migruj FAQ z kodu'}</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <FAQList
            faqs={faqs}
            onEdit={handleEdit}
            onDelete={(id) => deleteFAQ(id).then(() => loadFAQs())}
            onHardDelete={handleHardDelete}
            onToggleActive={handleToggleActive}
            onAdd={handleAdd}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            loading={loading}
          />
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFAQ ? 'Edytuj FAQ' : 'Dodaj nowe FAQ'}
            </DialogTitle>
            <DialogDescription>
              {editingFAQ 
                ? 'Zaktualizuj pytanie i odpowiedź FAQ' 
                : 'Dodaj nowe pytanie i odpowiedź do FAQ'
              }
            </DialogDescription>
          </DialogHeader>
          <FAQForm
            faq={editingFAQ}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Hard delete confirmation */}
      <AlertDialog open={!!deletingFAQId} onOpenChange={() => setDeletingFAQId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potwierdź trwałe usunięcie</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz TRWALE usunąć to FAQ? Rekord zostanie skasowany z bazy danych i nie będzie można go przywrócić.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmHardDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń trwale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Migration confirmation */}
      <AlertDialog open={showMigrationConfirm} onOpenChange={setShowMigrationConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potwierdź migrację FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja usunie wszystkie istniejące FAQ z bazy i wstawi 175 wpisów (35 pytań × 5 języków) z danych statycznych. Czy kontynuować?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleMigration}>
              Rozpocznij migrację
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FAQManager;
