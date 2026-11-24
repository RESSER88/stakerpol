import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Copy, ExternalLink, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SEOManagerToolProps {
  className?: string;
}

const SEOManagerTool = ({ className }: SEOManagerToolProps) => {
  const [gscCode, setGscCode] = useState('');
  const [domain, setDomain] = useState('stakerpol.pl');
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Skopiowano!',
      description: 'Tekst został skopiowany do schowka',
    });
  };

  const sitemapUrls = [
    `https://${domain}/sitemap.php`,
    'https://peztqgfmmnxaaoapzpbw.supabase.co/functions/v1/sitemap',
    'https://peztqgfmmnxaaoapzpbw.supabase.co/functions/v1/geo-feed'
  ];

  const openGSC = () => {
    window.open('https://search.google.com/search-console', '_blank');
  };

  const openGA4 = () => {
    window.open('https://analytics.google.com/analytics/', '_blank');
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            SEO & Analytics Setup Tool
          </CardTitle>
          <CardDescription>
            Narzędzie do konfiguracji Google Search Console, Analytics i monitoringu SEO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gsc" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gsc">Google Search Console</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            </TabsList>

            <TabsContent value="gsc" className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>KRYTYCZNE:</strong> Strona nie jest zindeksowana przez Google. Wymagane natychmiastowe działanie.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="domain">Domena</Label>
                  <Input
                    id="domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="stakerpol.pl"
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <h4 className="font-semibold">Krok 1: Dodaj właściwość w GSC</h4>
                  <Button onClick={openGSC} className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Otwórz Google Search Console
                  </Button>
                  <p className="text-sm text-gray-600">
                    Dodaj właściwość URL: https://{domain}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <h4 className="font-semibold">Krok 2: Kod weryfikacji</h4>
                  <div>
                    <Label htmlFor="gscCode">Meta tag verification code</Label>
                    <Input
                      id="gscCode"
                      value={gscCode}
                      onChange={(e) => setGscCode(e.target.value)}
                      placeholder="google123abc456def..."
                    />
                  </div>
                  {gscCode && (
                    <div className="p-3 bg-white border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Meta tag do dodania:</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(`<meta name="google-site-verification" content="${gscCode}" />`)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Kopiuj
                        </Button>
                      </div>
                      <code className="text-xs bg-gray-100 p-2 rounded block">
                        {`<meta name="google-site-verification" content="${gscCode}" />`}
                      </code>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <h4 className="font-semibold">Krok 3: Dodaj sitemaps</h4>
                  <div className="space-y-2">
                    {sitemapUrls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white border rounded">
                        <code className="text-sm">{url}</code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(url)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">GA4 już skonfigurowany</span>
                </div>
                <p className="text-sm text-green-700">
                  Google Analytics 4 (G-3RNZX5J15X) jest już zintegrowany w aplikacji.
                </p>
              </div>

              <Button onClick={openGA4} className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Otwórz Google Analytics
              </Button>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Web Vitals Tracking</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Aplikacja automatycznie śledzi Core Web Vitals (LCP, INP, CLS) i wysyła je do GA4.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Largest Contentful Paint (LCP)</li>
                  <li>• Interaction to Next Paint (INP)</li>
                  <li>• Cumulative Layout Shift (CLS)</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Wymagane: Skonfiguruj production monitoring (Sentry/LogRocket) w ciągu 48h.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Opcja 1: Sentry (Zalecane)</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Monitoring błędów i wydajności dla React aplikacji.
                  </p>
                  <Button
                    onClick={() => window.open('https://sentry.io/', '_blank')}
                    variant="outline"
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Sentry.io - Utwórz projekt
                  </Button>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Opcja 2: LogRocket</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Session replay i monitoring UX.
                  </p>
                  <Button
                    onClick={() => window.open('https://logrocket.com/', '_blank')}
                    variant="outline"
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    LogRocket - Utwórz konto
                  </Button>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold mb-2">Wewnętrzny monitoring</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Aplikacja ma wbudowany system conditional logging i performance tracking.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Conditional logging (tylko development)</li>
                    <li>• Performance measurement utilities</li>
                    <li>• Error boundary z graceful fallback</li>
                    <li>• Supabase health check endpoints</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOManagerTool;