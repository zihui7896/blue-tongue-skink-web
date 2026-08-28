import{initSidebar}from"./components/sidebar.js";import{initPetPlayground}from"./features/pet-playground.js";import{initEffectsGallery}from"./features/effects-gallery.js";
initPetPlayground();const effects=initEffectsGallery();initSidebar({onViewChange:name=>effects.setVisible(name==="effects")});
