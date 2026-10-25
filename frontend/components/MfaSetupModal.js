import { QRCodeSVG } from 'qrcode.react';

export default function MfaSetupModal({
  setupRequired,
  otpauthUrl,
  code,
  error,
  cargando,
  cargandoQr,
  onCodeChange,
  onSubmit,
  onCancel,
}) {
  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body p-4 p-md-5">
        <span className="badge text-bg-primary mb-3">
          {setupRequired ? 'Configuración inicial' : 'Verificación de acceso'}
        </span>
        <h1 className="h3 mb-2">
          {setupRequired ? 'Configura tu autenticación multifactor' : 'Verifica tu identidad'}
        </h1>
        <p className="text-secondary mb-4">
          {setupRequired
            ? 'Escanea el código QR con Google Authenticator u otra aplicación TOTP y escribe el código de 6 dígitos para activar MFA.'
            : 'Escribe el código de 6 dígitos que muestra tu aplicación de autenticación.'}
        </p>

        {setupRequired && (
          <div className="text-center mb-4" aria-live="polite">
            {cargandoQr && <div className="spinner-border text-primary" role="status" aria-label="Generando código QR" />}
            {!cargandoQr && otpauthUrl && (
              <div className="d-inline-block bg-white border rounded p-3">
                <QRCodeSVG value={otpauthUrl} size={216} level="M" />
              </div>
            )}
            {!cargandoQr && !otpauthUrl && (
              <p className="text-danger mb-0">No se pudo cargar el código QR. Intenta de nuevo.</p>
            )}
          </div>
        )}

        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        <form onSubmit={onSubmit}>
          <label htmlFor="mfa-code" className="form-label fw-semibold">Código de autenticación</label>
          <input
            id="mfa-code"
            className="form-control form-control-lg text-center"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={onCodeChange}
            placeholder="000000"
            aria-describedby="mfa-code-help"
            required
            disabled={cargando}
          />
          <div id="mfa-code-help" className="form-text">
            Ingresa los 6 dígitos sin espacios.
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg w-100 mt-4"
            disabled={cargando || code.length !== 6 || (setupRequired && (!otpauthUrl || cargandoQr))}
          >
            {cargando ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Verificando...
              </>
            ) : setupRequired ? 'Activar MFA y continuar' : 'Verificar e ingresar'}
          </button>
        </form>

        <button type="button" className="btn btn-link w-100 mt-2" onClick={onCancel} disabled={cargando}>
          Volver al inicio de sesión
        </button>
      </div>
    </section>
  );
}
