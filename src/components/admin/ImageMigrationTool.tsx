
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MigrationResult {
  imageId: string;
  status: 'success' | 'error';
  newUrl?: string;
  error?: string;
}

interface MigrationStats {
  total: number;
  success: number;
  errors: number;
}

const ImageMigrationTool = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([]);
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const { toast } = useToast();

  const startMigration = async () => {
    setIsMigrating(true);
    setMigrationResults([]);
    setStats(null);

    try {
      console.log('Starting image migration...');
      
      const { data, error } = await supabase.functions.invoke('migrate-images', {
        body: {}
      });

      if (error) {
        console.error('Migration error:', error);
        throw error;
      }

      console.log('Migration response:', data);
      
      if (data.success) {
        setMigrationResults(data.results || []);
        setStats(data.stats);
        
        toast({
          title: "✅ Migracja ukończona!",
          description: `Pomyślnie przeniesiono ${data.stats.success} obrazów do Supabase Storage.`,
          duration: 5000
        });
      } else {
        throw new Error(data.error || 'Migration failed');
      }

    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "❌ Błąd migracji",
        description: error.message || "Nie udało się przeprowadzić migracji obrazów",
        variant: "destructive",
        duration: 7000
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Migracja obrazów do Supabase Storage
        </CardTitle>
        <CardDescription>
          Przeniesienie obrazów base64 z bazy danych do Supabase Storage dla lepszej wydajności
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Status migracji</h3>
            <p className="text-sm text-muted-foreground">
              Kliknij przycisk, aby rozpocząć migrację obrazów
            </p>
          </div>
          
          <Button
            onClick={startMigration}
            disabled={isMigrating}
            className="cta-button"
          >
            {isMigrating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Migracja w toku...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Rozpocznij migrację
              </>
            )}
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-editorial-line/30 rounded-lg">
              <div className="text-2xl font-bold text-stakerpol-navy">{stats.total}</div>
              <div className="text-sm text-editorial-muted">Całkowite</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.success}</div>
              <div className="text-sm text-editorial-muted">Sukces</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
              <div className="text-sm text-editorial-muted">Błędy</div>
            </div>
          </div>
        )}

        {migrationResults.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold">Wyniki migracji</h4>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {migrationResults.map((result, index) => (
                <div
                  key={result.imageId}
                  className="flex items-center justify-between p-3 bg-editorial-line/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">Obraz #{index + 1}</div>
                      <div className="text-sm text-editorial-muted">{result.imageId}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                      {result.status === 'success' ? 'Sukces' : 'Błąd'}
                    </Badge>
                    {result.error && (
                      <span className="text-xs text-red-600 max-w-48 truncate">
                        {result.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageMigrationTool;
