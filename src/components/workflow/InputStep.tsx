'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { InputStepProps } from './types';

export function InputStep({
  keyword,
  setKeyword,
  location,
  setLocation,
  businessType,
  setBusinessType,
  loading,
  onAnalyze,
}: InputStepProps) {
  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Intent Analysis</CardTitle>
        <CardDescription>
          Enter your target keyword to analyze search intent and discover opportunities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="keyword">Keyword *</Label>
          <Input
            id="keyword"
            placeholder="e.g., best CRM software"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location (optional)</Label>
          <Input
            id="location"
            placeholder="e.g., United States, New York, etc."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business-type">Business Type (optional)</Label>
          <Select
            value={businessType}
            onValueChange={(value) => setBusinessType(value as typeof businessType)}
            disabled={loading}
          >
            <SelectTrigger id="business-type" className="w-full">
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="real_estate">Real Estate</SelectItem>
              <SelectItem value="hospitality">Hospitality</SelectItem>
              <SelectItem value="saas">SaaS</SelectItem>
              <SelectItem value="local_services">Local Services</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full" onClick={onAnalyze} disabled={!keyword.trim() || loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              AI analyzing intent (human approval required)…
            </>
          ) : (
            'Analyze Intent'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
