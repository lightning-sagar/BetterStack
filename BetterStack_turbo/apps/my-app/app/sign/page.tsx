import { BackgroundDecor } from "../components/landing/BackgroundDecor";
import { AuthPortal } from "../components/auth/AuthPortal";
import { PageShell } from "../components/landing/PageShell";

export default function SignPage() {
  return (
    <PageShell>
      <BackgroundDecor />
      <AuthPortal />
    </PageShell>
  );
}
