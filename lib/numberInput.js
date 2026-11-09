/* Helpers compartidos para los <input type="number"> de la plataforma.

   Las flechitas nativas del navegador se ocultan globalmente (ver app/globals.css).
   Los conteos (dormitorios, baños, cocheras, ambientes, etc.) usan <AdminStepper>,
   que ya clampea a >= 0 y trae sus propios botones +/−.

   Para los campos tipeados que no llevan stepper (montos, superficies, %),
   `nonNegativeProps` evita que se pueda ingresar un valor negativo. */

// Bloquea el signo negativo, el "+" y la notación científica ("e").
export const blockNegativeKey = (e) => {
  if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
    e.preventDefault();
  }
};

// Spread para inputs numéricos que deben ser >= 0 y no llevan botones +/−.
export const nonNegativeProps = { min: 0, onKeyDown: blockNegativeKey };
