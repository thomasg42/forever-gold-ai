// Gives Goldie (the ElevenLabs website voice) one site tool: connect_to_thomas.
// A website voice chat cannot forward a phone call, so this opens the visitor's
// dialer to Thomas's number. The Call and Text buttons on the page still work as the fallback.
(function () {
  var TEL = 'tel:+14066986693';

  function connectToThomas() {
    try { window.location.href = TEL; } catch (e) { /* the page's Call button still works */ }
    return 'Opened the phone dialer for Thomas at 406-698-6693. If it did not open, the visitor can call or text that number.';
  }

  function attach(widget) {
    widget.addEventListener('elevenlabs-convai:call', function (event) {
      var config = event.detail && event.detail.config;
      if (!config) return;
      config.clientTools = Object.assign({}, config.clientTools, { connect_to_thomas: connectToThomas });
    });
  }

  function init() {
    var widget = document.querySelector('elevenlabs-convai');
    if (widget) attach(widget);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
