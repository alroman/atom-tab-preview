'use strict';

const $ = require('jquery');

function NodeBugView(editor) {

  // var message = document.createElement('div');
  // message.textContent = "The NodeBug package is Alive! It's ALIVE!";
  // message.classList.add('message');
  //
  // this.element = document.createElement('div');
  // this.element.classList.add('tab-preview');
  // this.element.appendChild(message);

  var gutterContainer = $('.gutter-container', editor.rootElement);
  var lineNumbers = $('.line-numbers', gutterContainer);
  // var debuggers = $('<div>', {
  //   'class': 'gutter',
  //   'gutter-name': 'debugger'
  // });

  //gutterContainer.prepend(debuggers);

  lineNumbers.on('click', '.line-number', function(){

    let line = $(this);
    let current = line.find('icon-debug');

    if(current.length > 0){
      current.trigger('click');
    }else{

      let lineDebug = $('<div>', {
        class: 'icon-debug'
      });

      lineDebug.on('click', function(){
        lineDebug.remove();
      });

      line.append(lineDebug);
    }
  });
}

NodeBugView.prototype = {
  serialize() {

  },
  destroy() {
    consoole.log('destroying view');
    return this.element.remove();
  },
  getElement() {
    return this.element;
  }
};

module.exports = NodeBugView;
