import { cn } from "@/lib/utils";
import { nomeDe, type Perfil } from "@/lib/radar";

const CORES = ["#a543fa", "#59327a", "#ff5959", "#e09a00", "#7c3aed", "#c2410c", "#0f766e", "#be185d"];

/** Ícone da pessoa: a foto que ela enviou ou as iniciais numa cor fixa por e-mail. */
export function Avatar({
  email,
  perfis,
  tamanho = 44,
  className,
}: {
  email: string;
  perfis?: Record<string, Perfil>;
  tamanho?: number;
  className?: string;
}) {
  const foto = perfis?.[email]?.foto;
  const nome = nomeDe(email, perfis);
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  const cor = CORES[[...email].reduce((s, c) => s + c.charCodeAt(0), 0) % CORES.length];

  return foto ? (
    <img
      src={foto}
      alt={nome}
      style={{ width: tamanho, height: tamanho }}
      className={cn("shrink-0 rounded-full object-cover ring-2 ring-white", className)}
    />
  ) : (
    <span
      aria-label={nome}
      style={{ width: tamanho, height: tamanho, background: cor, fontSize: tamanho * 0.38 }}
      className={cn("flex shrink-0 items-center justify-center rounded-full font-black text-white ring-2 ring-white", className)}
    >
      {iniciais || "?"}
    </span>
  );
}

/** Reduz a imagem escolhida para um quadrado de 160px (JPEG), pequeno o bastante para salvar no perfil. */
export function reduzirFoto(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(arquivo);
    img.onload = () => {
      const lado = 160;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = lado;
      const ctx = canvas.getContext("2d")!;
      const menor = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - menor) / 2, (img.height - menor) / 2, menor, menor, 0, 0, lado, lado);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não consegui abrir essa imagem"));
    };
    img.src = url;
  });
}
