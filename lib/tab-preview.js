'use strict';

const _ = require('lodash');
const path = require('path');
const phantom = require('phantom');
const fs = require('fs');
const CompositeDisposable = require('atom').CompositeDisposable;
// const NodeBugView = require('./tab-preview-view');

module.exports = {
  nodeBugViews: [],
  subscriptions: null,
  config: {
    height: {
      type: 'number',
      default: 9
    }
  },
  activate(state) {

    var composite = new CompositeDisposable;
    var commands = atom
      .commands
      .add('atom-workspace', {
        'tab-preview:toggle': () => {
          return this.toggle();
        }
      });

    this.subscriptions = composite;

    function getTitleView(pane){

      return atom
        .views
        .getView(atom.workspace)
        .querySelector(`.tab .title[data-path='${pane.getPath()}']`);
    }

    function addPreview(pane){

      let paneView = atom.views.getView(pane);
      let titleView = getTitleView(pane);
      let tabView  = titleView.parentElement;
      let previewView = tabView.querySelector('.wim-tab-preview');

      if(!previewView) {
        //Adding Preview Element
        previewView = document.createElement('div');
        previewView.className = 'wim-tab-preview';
        tabView.insertBefore(previewView, titleView);
      }

      let temporaryView = document.createElement('div');
      let styles = document.querySelector('head atom-styles');
      temporaryView.innerHTML = `<style> body{ color: rgba(255,255,255, .5) } </style>
        ${styles.innerHTML}
        ${paneView.shadowRoot.innerHTML}`;

      let lines = temporaryView.querySelectorAll('.line-number');

      if (lines && lines.length > 1) {

        let pinstance;
        let page = phantom
          .create()
          .then(function(ph) {
            pinstance = ph;
            return ph.createPage();
          })
          .then(function(page){

            var removals = [
              'atom-text-editor-minimap',
              '.vertical-scrollbar',
              '.horizontal-scrollbar',
              '.scrollbar-corner',
              'content[select="atom-overlay"]'
            ];

            _.each(removals, selector => {
              var el = temporaryView.querySelector(selector);
              if(el){
                el.parentElement.removeChild(el);
              }
            });

            page.property('viewportSize', {
              width: 200,
              height: 400
            });

            page.setContent(temporaryView.innerHTML, 'http://localhost/');

            return page.renderBase64();
          })
          .then(function(content){
            pinstance.exit();
            var img = previewView.querySelector('img');
            if(!img){
              img = document.createElement('img');
              previewView.appendChild(img);
            }
            img.src = `data:image/png;base64,${content}`;
            console.log('preview img', img);
          });
      }
    }

    function customizeTitle(pane){

      return new Promise(function changeTitle(resolve){

        return setTimeout(function(){

          let titleView = getTitleView(pane);

          if(titleView){

            let fileName = path.parse(pane.getTitle());
            let fileExt = fileName.ext.split('.').pop();
            titleView.innerHTML = `<b class="wim-tab-flag">${fileExt}</b> ${fileName.name}`;
            resolve(titleView);

          } else {
            console.log('title not attached trying again');
            return customizeTitle(pane);
          }
        });
      });
    }

    function observePane(pane){

      if(pane.onDidChange){

        // let pane = event.item;
        let refreshHandler;
        let refreshPreview = function(){
          addPreview(pane);
        };

        customizeTitle(pane).then( () => {
          addPreview(pane);
        });

        composite.add(pane.onDidChangeScrollTop(function(){
          clearTimeout(refreshHandler);
          refreshHandler = setTimeout(() => {
            addPreview(pane);
          }, 500);
        }));
        composite.add(pane.onDidChange(refreshPreview));
        composite.add(pane.onDidStopChanging(refreshPreview));
      }
    }

    composite.add(commands);
    composite.add(atom.workspace.observePaneItems(observePane));
    composite.add(atom.config.onDidChange('tab-preview.height', (val) => {
      var tabs = document.querySelector('atom-pane .tab-bar');
      var tabs = document.querySelector('atom-pane .tab-bar');
      if (tabs) {
        tabs.style.height = `${val.newValue}rem`;
      }
    }));

    atom.packages.onDidActivateInitialPackages(function(){
      console.log('activate test');
    });

  },
  deactivate() {
    this.subscriptions.dispose();
  },
  toggle(){
    console.log('toggle');
  }
};
