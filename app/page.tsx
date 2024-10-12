import PosterGenerator from '@/components/PosterGenerator';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Magazine Style Poster Generator</h1>
      <PosterGenerator />
    </main>
  );
}