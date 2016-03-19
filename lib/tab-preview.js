'use strict';

const _ = require('lodash');
const path = require('path');
const phantom = require('phantom');
const fs = require('fs');
const CompositeDisposable = require('atom').CompositeDisposable;

var phantomInstance;
var phantomPage;

phantom
  .create()
  .then(ph => {
    phantomInstance = ph;
    return ph.createPage();
  })
  .then(page => {
    page.property('viewportSize', {
      width: 250,
      height: 300
    });
    phantomPage = page;
    return phantomPage;
  });

module.exports = {
  subscriptions: null,
  config: {
    height: {
      type: 'number',
      default: 8
    }
  },
  activate(state) {

    var composite = new CompositeDisposable();
    var commands = atom.commands.add('atom-workspace', {
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

    function addImage(temporaryView, previewView) {

      _.defer(function() {

        phantomPage
          .setContent(temporaryView.innerHTML, '')
          .then( () => {
            return phantomPage.renderBase64();
          })
          .then(function(base64Image){
            var img = previewView.querySelector('img');
            if(!img){
              img = document.createElement('img');
              previewView.appendChild(img);
            }
            img.src = `data:image/png;base64,${base64Image}`;
          });
      });
    }

    function addPreview(pane){

      let paneView = atom.views.getView(pane);
      let titleView = getTitleView(pane);

      if(titleView){

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
        let contentView = paneView.shadowRoot || paneView;
        let removals = [
          'atom-text-editor-minimap',
          '.vertical-scrollbar',
          '.horizontal-scrollbar',
          '.scrollbar-corner',
          'content[select="atom-overlay"]'
        ];

        // console.log(contentView.innerText || contentView.textContent);
        //${styles.innerHTML}
        temporaryView.innerHTML = `
          <style>
            html, body{
              overflow: hidden;
              height: 100%;
            }
            body{
             font-family: Menlo, Consolas, 'DejaVu Sans Mono', monospace;
             color: rgba(255, 255, 255, .4);
             margin: 0;
             padding: 0;
            }
            .indent-guide{
             opacity: .2;
            }
          <style>
          ${contentView.innerHTML}`;

        _.each(removals, selector => {
          var el = temporaryView.querySelector(selector);
          if(el){
            el.parentElement.removeChild(el);
          }
        });
        addImage(temporaryView, previewView);
      }
    }

    function customizeTitle(pane){

      return new Promise(function changeTitle(resolve){

        return setTimeout(function(){

          let titleView = getTitleView(pane);

          if(titleView){

            let fileName = path.parse(pane.getTitle());
            let fileExt = fileName.ext.split('.').pop();
            let extElement = fileExt ?
              `<b class="wim-tab-flag">${fileExt}</b>` :
              '';
            titleView.innerHTML = `${extElement} ${fileName.name}`;
            resolve(titleView);
          }
        });
      });
    }

    function observePane(pane){

      if(pane.onDidChange){

        // let pane = event.item;
        let refreshHandler;
        let refreshPreview = function(){
          clearTimeout(refreshHandler);
          refreshHandler = setTimeout(() => {
            customizeTitle(pane).then( () => {
              addPreview(pane);
            });
          }, 600);
        };

        customizeTitle(pane).then( () => {
          addPreview(pane);
        });

        if (pane.onDidChangeScrollTop) {
          composite.add(pane.onDidChangeScrollTop(refreshPreview));
        }
        
        if (pane.getBuffer) {
          composite.add(pane.getBuffer( test => {
            console.log('getBuffer', test);
          }));
        }

        composite.add(pane.onDidChange(refreshPreview));
      }
    }

    composite.add(commands);
    composite.add(atom.workspace.observeTextEditors(observePane));
    composite.add(atom.config.onDidChange('tab-preview.height', (val) => {
      var tabs = document.querySelector('atom-pane .tab-bar');
      var tabs = document.querySelector('atom-pane .tab-bar');
      if (tabs) {
        tabs.style.height = `${val.newValue}rem`;
      }
    }));
  },
  deactivate() {
    phantomInstance.exit();
    this.subscriptions.dispose();
  }
};
