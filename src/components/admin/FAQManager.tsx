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
    try {
      await toggleFAQActive(id, isActive);
    } catch (e) {
      // Toast already shown in hook; swallow to avoid unhandled rejection
    }
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
      <div className="border-b border-editorial-line pb-3 mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl text-editorial-ink tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Zarządzanie FAQ
          </h1>
          <p className="text-xs text-editorial-muted mt-1 italic">
            Pytania i odpowiedzi we wszystkich językach
          </p>
        </div>
        {FEATURES.SHOW_FAQ_MIGRATION && (
          <button
            onClick={() => setShowMigrationConfirm(true)}
            disabled={migrationLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold tracking-[0.2em] uppercase text-editorial-muted border border-editorial-line hover:text-editorial-ink hover:border-editorial-ink transition-colors disabled:opacity-50"
          >
            <Download className="h-3 w-3" />
            {migrationLoading ? 'Migracja…' : 'Migruj z kodu'}
          </button>
        )}
      </div>

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
