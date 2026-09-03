import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield, 
  Zap, 
  Search,
  Monitor,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SEOManagerTool from '@/components/seo/SEOManagerTool';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface ProductionReadinessPanelProps {
  className?: string;
}

interface SecurityIssue {
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action?: string;
}

const ProductionReadinessPanel = ({ className }: ProductionReadinessPanelProps) => {
  const [securityIssues, setSecurityIssues] = useState<SecurityIssue[]>([]);
  const [isRunningChecks, setIsRunningChecks] = useState(false);
  const { toast } = useToast();

  const runSecurityAudit = async () => {
    setIsRunningChecks(true);
    try {
      // Uruchom security audit
      const { data, error } = await supabase.rpc('security_audit');
      
      if (error) {
        throw error;
      }

      // Mapuj wyniki na issues z proper type checking
      const issues: SecurityIssue[] = [];
      const auditData = data as any; // Type assertion for RPC result
      
      if (auditData?.function_search_path_warning) {
        issues.push({
          type: 'critical',
          title: 'Niezabezpieczona search_path w funkcji',
          description: 'Funkcja search_path może być podatna na ataki. Wymagana natychmiastowa naprawa.',
          action: 'Skonfiguruj bezpieczną search_path w funkcjach Supabase'
        });
      }

      if (auditData?.otp_expiry_hours && auditData.otp_expiry_hours > 24) {
        issues.push({
          type: 'warning',
          title: 'Długi czas wygaśnięcia OTP',
          description: `OTP wygasa po ${auditData.otp_expiry_hours}h. Zalecane: maksymalnie 24h.`,
          action: 'Zmniejsz czas wygaśnięcia OTP w ustawieniach Supabase Auth'
        });
      }

      if (auditData?.leaked_password_protection_disabled) {
        issues.push({
          type: 'warning',
          title: 'Wyłączona ochrona przed wyciekniętymi hasłami',
          description: 'Brak weryfikacji haseł względem baz danych wycieków.',
          action: 'Włącz leaked password protection w Supabase Auth'
        });
      }

      setSecurityIssues(issues);
      
      toast({
        title: 'Audit bezpieczeństwa zakończony',
        description: `Znaleziono ${issues.length} problemów wymagających uwagi`,
        variant: issues.some(i => i.type === 'critical') ? 'destructive' : 'default'
      });

    } catch (error) {
      logger.error('Security audit error:', error);
      toast({
        title: 'Błąd audytu bezpieczeństwa',
        description: 'Nie udało się przeprowadzić audytu. Sprawdź połączenie z bazą danych.',
        variant: 'destructive'
      });
    } finally {
      setIsRunningChecks(false);
    }
  };

  const readinessScore = () => {
    const critical = securityIssues.filter(i => i.type === 'critical').length;
    const warnings = securityIssues.filter(i => i.type === 'warning').length;
    
    if (critical > 0) return 40; // Critical issues block production
    if (warnings > 2) return 65;
    if (warnings > 0) return 85;
    return 95;
  };

  const getReadinessStatus = () => {
    const score = readinessScore();
    if (score >= 90) return { color: 'green', label: 'GOTOWE DO PRODUKCJI' };
    if (score >= 80) return { color: 'yellow', label: 'PRAWIE GOTOWE' };
    return { color: 'red', label: 'NIE GOTOWE' };
  };

  const status = getReadinessStatus();

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header z ogólnym statusem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Production Readiness Dashboard</span>
              <Badge 
                variant={status.color === 'green' ? 'default' : 'destructive'}
                className="text-sm"
              >
                {status.label}
              </Badge>
            </CardTitle>
            <CardDescription>
              Kompleksowy przegląd gotowości aplikacji do wdrożenia produkcyjnego
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Gotowość ogólna</span>
                  <span>{readinessScore()}%</span>
                </div>
                <Progress value={readinessScore()} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-editorial-line/30 rounded-lg">
                  <Shield className="w-6 h-6 mx-auto mb-1 text-red-500" />
                  <div className="text-sm font-medium">Security</div>
                  <div className="text-xs text-red-600">Issues: {securityIssues.length}</div>
                </div>
                <div className="p-3 bg-editorial-line/30 rounded-lg">
                  <Zap className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
                  <div className="text-sm font-medium">Performance</div>
                  <div className="text-xs text-yellow-600">Needs optimization</div>
                </div>
                <div className="p-3 bg-editorial-line/30 rounded-lg">
                  <Search className="w-6 h-6 mx-auto mb-1 text-red-500" />
                  <div className="text-sm font-medium">SEO</div>
                  <div className="text-xs text-red-600">Zero indexing</div>
                </div>
                <div className="p-3 bg-editorial-line/30 rounded-lg">
                  <Monitor className="w-6 h-6 mx-auto mb-1 text-editorial-muted" />
                  <div className="text-sm font-medium">Monitoring</div>
                  <div className="text-xs text-editorial-muted">Not configured</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="security" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Audit
                  </CardTitle>
                  <CardDescription>
                    Sprawdź konfigurację bezpieczeństwa przed wdrożeniem
                  </CardDescription>
                </div>
                <Button 
                  onClick={runSecurityAudit}
                  disabled={isRunningChecks}
                  size="sm"
                >
                  {isRunningChecks ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  Uruchom audit
                </Button>
              </CardHeader>
              <CardContent>
                {securityIssues.length === 0 && !isRunningChecks && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Uruchom audit bezpieczeństwa aby sprawdzić konfigurację.
                    </AlertDescription>
                  </Alert>
                )}

                {securityIssues.map((issue, index) => (
                  <Alert key={index} className="mb-4">
                    <div className="flex items-start gap-3">
                      {issue.type === 'critical' ? (
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      ) : issue.type === 'warning' ? (
                        <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{issue.title}</span>
                          <Badge 
                            variant={issue.type === 'critical' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {issue.type.toUpperCase()}
                          </Badge>
                        </div>
                        <AlertDescription className="text-sm">
                          {issue.description}
                        </AlertDescription>
                        {issue.action && (
                          <div className="mt-2 text-xs text-editorial-muted bg-editorial-line/30 p-2 rounded">
                            <strong>Akcja:</strong> {issue.action}
                          </div>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>NAPRAWIONO:</strong> Conditional logging zastąpił console.log pollution w production.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Performance Issues Resolved</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Console.log pollution - Fixed with conditional logging</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Performance tracking - Enhanced with error handling</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Web Vitals - Safe dynamic imports with fallbacks</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo">
            <SEOManagerTool />
          </TabsContent>

          <TabsContent value="checklist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pre-Deployment Checklist</CardTitle>
                <CardDescription>
                  Sprawdź wszystkie elementy przed wdrożeniem na produkcję
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Build configuration (vite.config.ts)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">SPA routing (_redirects)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Conditional logging implementation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-sm">Google Search Console verification</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-sm">Sitemap submission</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm">Production monitoring setup (48h)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductionReadinessPanel;