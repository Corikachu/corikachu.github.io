// open a new tab when click a url contained other domain.
$(document.links).filter(function() {
    return this.hostname != window.location.hostname;
}).attr('target', '_blank');
