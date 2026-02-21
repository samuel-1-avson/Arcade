// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  // SPA Back Button
  document.getElementById('back-to-hub')?.addEventListener('click', () => {
    if (window.GameBridge) {
      window.GameBridge.exitGame();
    } else {
      window.location.href = '../../index.html';
    }
  });

  window.gameManager = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
});
