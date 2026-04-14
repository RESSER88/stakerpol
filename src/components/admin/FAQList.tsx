import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Power, PowerOff } from 'lucide-react';
import { FAQ } from '@/hooks/useSupabaseFAQ';

interface FAQListProps {
  faqs: FAQ[];
  onEdit: (faq: FAQ) => void;
  onDelete: (id: string) => void;
  onHardDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onAdd: () => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  loading: boolean;
}

const FAQList: React.FC<FAQListProps> = ({
  faqs,
  onEdit,
  onDelete,
  onHardDelete,
  onToggleActive,
  onAdd,
  selectedLanguage,
  onLanguageChange,
  loading,
}) => {
  const languages = [
    { value: 'all', label: 'Wszystkie języki' },
    { value: 'pl', label: 'Polski' },
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
    { value: 'cs', label: 'Čeština' },
    { value: 'sk', label: 'Slovenčina' },
  ];

  const filteredFAQs = selectedLanguage === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.language === selectedLanguage);

  const getLanguageLabel = (language: string) => {
    const lang = languages.find(l => l.value === language);
    return lang ? lang.label : language;
  };

  if (loading) {
    return <div className="text-center py-8">Ładowanie FAQ...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Select value={selectedLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Wybierz język" />
            </SelectTrigger>
            <SelectContent className="bg-background border">
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            Wyświetlane: {filteredFAQs.length} z {faqs.length}
          </span>
        </div>

        <Button onClick={onAdd} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Dodaj FAQ</span>
        </Button>
      </div>

      {filteredFAQs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {selectedLanguage === 'all' 
            ? 'Brak FAQ w bazie danych' 
            : `Brak FAQ w języku: ${getLanguageLabel(selectedLanguage)}`
          }
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Język</TableHead>
                <TableHead>Pytanie</TableHead>
                <TableHead>Kolejność</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFAQs.map((faq) => (
                <TableRow key={faq.id} className={!faq.is_active ? 'opacity-50' : ''}>
                  <TableCell>
                    <Badge variant="outline">
                      {getLanguageLabel(faq.language)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={faq.question}>
                      {faq.question}
                    </div>
                  </TableCell>
                  <TableCell>{faq.display_order}</TableCell>
                  <TableCell>
                    <Badge variant={faq.is_active ? "default" : "secondary"}>
                      {faq.is_active ? 'Aktywne' : 'Nieaktywne'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleActive(faq.id, !faq.is_active)}
                        title={faq.is_active ? 'Dezaktywuj' : 'Aktywuj'}
                      >
                        {faq.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4 text-primary" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(faq)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onHardDelete(faq.id)}
                        className="text-destructive hover:text-destructive"
                        title="Usuń trwale"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default FAQList;
