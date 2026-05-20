// Carga Google Identity Services y expone función global para inicializar el botón
window.initGoogleSignIn = function (clientId, callback) {
  if (!window.google || !window.google.accounts || !window.google.accounts.id) {
    console.error('Google Identity Services no está cargado');
    return;
  }
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: callback
  });
  window.google.accounts.id.renderButton(
    document.getElementById('googleBtnDiv'),
    { theme: 'outline', size: 'large' }
  );
};
