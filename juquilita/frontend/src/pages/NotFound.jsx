import { Link } from 'react-router-dom';
import StoreLayout from '../components/StoreLayout';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  return (
    <StoreLayout>
      <div className="container section">
        <EmptyState icon="search" title="Página no encontrada" action={<Link to="/" className="btn btn-primary">Volver al inicio</Link>}>
          La página que buscas no existe o cambió de lugar.
        </EmptyState>
      </div>
    </StoreLayout>
  );
}
