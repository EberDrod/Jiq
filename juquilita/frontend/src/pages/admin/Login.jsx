import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import Icon from '../../components/Icon';
import { Alert, Field, Spinner } from '../../components/ui';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (localStorage.getItem('token')) return <Navigate to="/admin" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Escribe tu correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.login(email.trim(), password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <div className="login-aside">
        <div className="brand brand-dark">
          <span className="brand-mark"><Icon name="hammer" size={18} strokeWidth={2.2} /></span>
          <span className="brand-text"><strong>JUQUILITA</strong><small>Panel de control</small></span>
        </div>
        <div>
          <h2>Administra tu tlapalería desde un solo lugar.</h2>
          <ul className="login-perks">
            <li><Icon name="clipboard" size={18} /> Atiende pedidos y actualiza su estado</li>
            <li><Icon name="warehouse" size={18} /> Controla entradas, salidas y existencias</li>
            <li><Icon name="alert" size={18} /> Recibe alertas de productos por agotarse</li>
          </ul>
        </div>
        <small>© {new Date().getFullYear()} Juquilita</small>
      </div>

      <div className="login-main">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <h1>Iniciar sesión</h1>
          <p className="text-muted">Ingresa con tu cuenta de administrador.</p>

          {params.get('expired') && !error && <Alert tone="info">Tu sesión expiró. Vuelve a iniciar sesión.</Alert>}
          {error && <Alert>{error}</Alert>}

          <Field label="Correo electrónico" htmlFor="email">
            <input id="email" className="input" type="email" autoComplete="username" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="admin@juquilita.com" autoFocus />
          </Field>
          <Field label="Contraseña" htmlFor="password">
            <div className="input-affix">
              <input id="password" className="input" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" className="icon-btn" onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
          </Field>

          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading}>
            {loading ? <><Spinner size={18} /> Entrando…</> : 'Entrar'}
          </button>
          <Link to="/" className="link-arrow login-back"><Icon name="arrowLeft" size={16} /> Volver a la tienda</Link>
        </form>
      </div>
    </div>
  );
}
