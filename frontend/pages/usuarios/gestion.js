import Link from 'next/link';
import UserForm from '../../components/UserForm';
import { useAuth } from '../../hooks/useAuth';
import styles from '../../styles/userManagement.module.css';

export default function GestionUsuarios() {
  const { rol, cargando } = useAuth();

  if (cargando) {
    return (
      <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary" role="status" aria-label="Validando permisos" />
      </main>
    );
  }

  if (rol !== 'administrador') {
    return (
      <main className="container py-5">
        <div className="alert alert-danger" role="alert">Solo un administrador puede modificar este requisito.</div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <Link href="/dashboard" className={styles.backLink}>
          <span aria-hidden="true">←</span> Volver al panel
        </Link>
        <section className={styles.card}>
          <div className={styles.cardBody}>
            <span className={styles.eyebrow}><span aria-hidden="true">🛡️</span> Gobernanza administrativa</span>
            <h1 className={styles.title}>Requisito de MFA por usuario</h1>
            <p className={styles.description}>
              Define si una cuenta debe usar autenticación multifactor. La autorización también se valida en el backend.
            </p>
            <div className={styles.apiNote} role="note">
              La API disponible actualiza usuarios por su ID de MongoDB y no incluye un endpoint para listar cuentas.
            </div>
            <UserForm />
          </div>
        </section>
      </div>
    </main>
  );
}
