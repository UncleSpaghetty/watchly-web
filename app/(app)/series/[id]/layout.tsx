import type { Metadata } from 'next';
import { cookies } from 'next/headers';

const fallbackMetadata: Metadata = {
  title: 'Dettaglio serie',
  description:
    'Consulta informazioni, episodi e progressi della serie selezionata su Watchly.',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  if (!apiBaseUrl || process.env.NEXT_PUBLIC_API_MOCK === 'true') {
    return fallbackMetadata;
  }

  const { id } = await params;
  const cookieStore = await cookies();

  try {
    const response = await fetch(
      `${apiBaseUrl}/series/${encodeURIComponent(id)}`,
      {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          Cookie: cookieStore.toString(),
        },
      },
    );

    if (!response.ok) return fallbackMetadata;

    const series = (await response.json()) as {
      title?: unknown;
      synopsis?: unknown;
    };
    if (typeof series.title !== 'string' || !series.title.trim()) {
      return fallbackMetadata;
    }

    const synopsis =
      typeof series.synopsis === 'string' && series.synopsis.trim()
        ? series.synopsis.trim().slice(0, 160)
        : `Consulta informazioni, episodi e progressi di ${series.title} su Watchly.`;

    return {
      title: series.title,
      description: synopsis,
    };
  } catch {
    return fallbackMetadata;
  }
}

export default function SeriesDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
