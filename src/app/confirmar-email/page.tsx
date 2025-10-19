/**
 * Página: Confirmar Email
 * VULNERABILIDAD CORREGIDA: ALTO #2
 */

export default function ConfirmarEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Confirma tu email</h1>
        <p className="text-gray-600 mb-6">
          Hemos enviado un enlace de confirmación a tu correo electrónico.
          Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
        </p>
        <p className="text-sm text-gray-500">
          Si no ves el email, revisa tu carpeta de spam.
        </p>
      </div>
    </div>
  )
}
