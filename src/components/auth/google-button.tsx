import Image from "next/image";
import { GhostButton } from "@/components/becan/kit";

/* زر محدّد الإطار لا كهرماني: الكهرماني الوحيد في الشاشة لزرّ الإرسال.
   علامة «G» بألوان Google الرسمية أصلٌ ثابت في `public/brand` لا ألوان في المكوّن. */
export function GoogleButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <GhostButton onClick={onClick} disabled={disabled} className="w-full gap-3">
      <Image src="/brand/google-g.svg" alt="" width={20} height={20} unoptimized aria-hidden="true" />
      {children}
    </GhostButton>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-4" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      <span className="text-sm font-semibold text-ink-2">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
