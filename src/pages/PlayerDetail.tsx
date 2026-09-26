import { useParams } from 'react-router-dom';

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-white">Detalle del Jugador</h1>
      <p className="mt-2 text-sm text-slate-400">ID del jugador: {id}</p>
    </div>
  );
}
