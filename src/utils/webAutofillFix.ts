import { Platform } from 'react-native';

/** Removes Chrome/Safari autofill’s solid white/blue inner box on web TextInputs. */
export function installWebAutofillFix(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const id = 'servicehub-web-autofill-fix';
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    /* Keep RN web inputs visually transparent inside glass fields */
    input,
    textarea {
      background-color: transparent !important;
      background-image: none !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      -webkit-appearance: none !important;
      appearance: none !important;
      /* Kill default blue focus ring on the raw input — glow is on the outer field */
      outline-color: transparent !important;
    }

    input:focus,
    textarea:focus {
      outline: none !important;
      box-shadow: none !important;
      border: none !important;
    }

    /* Kill the autofill “white/blue box inside the field” */
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active,
    textarea:-webkit-autofill,
    textarea:-webkit-autofill:hover,
    textarea:-webkit-autofill:focus,
    textarea:-webkit-autofill:active {
      -webkit-text-fill-color: #FFFFFF !important;
      caret-color: #FFFFFF !important;
      border: none !important;
      outline: none !important;
      background-color: transparent !important;
      background-image: none !important;
      transition: background-color 99999s ease-out 0s !important;
      -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
      box-shadow: 0 0 0px 1000px transparent inset !important;
    }
  `;
  document.head.appendChild(style);
}
