import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Frio Alimentaria Logo"
      width={1005}
      height={564}
      className={className}
      priority // The logo is important for LCP
    />
  );
}
