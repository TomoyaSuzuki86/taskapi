import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function SettingsPlaceholderPage() {
  return (
    <div className="stack stack--page">
      <Card>
        <p className="section-heading__eyebrow">Configuration</p>
        <h2>Settings and auth placeholder</h2>
        <p className="muted-copy">
          Sign-in, sign-out, and account-specific settings are deferred. This
          page only provides stable UI primitives for future auth wiring.
        </p>
      </Card>
      <Card>
        <div className="stack">
          <Input
            label="Display name preview"
            placeholder="Single-user only"
            disabled
          />
          <Button type="button" disabled>
            Google sign-in lands in the next phase
          </Button>
        </div>
      </Card>
    </div>
  );
}
