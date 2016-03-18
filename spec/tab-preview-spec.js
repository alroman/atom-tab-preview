var NodeBug;

NodeBug = require('../lib/tab-preview');

describe("NodeBug", function() {
  var activationPromise, ref, workspaceElement;
  ref = [], workspaceElement = ref[0], activationPromise = ref[1];
  beforeEach(function() {
    workspaceElement = atom.views.getView(atom.workspace);
    return activationPromise = atom.packages.activatePackage('tab-preview');
  });
  return describe("when the tab-preview:toggle event is triggered", function() {
    it("hides and shows the modal panel", function() {
      expect(workspaceElement.querySelector('.tab-preview')).not.toExist();
      atom.commands.dispatch(workspaceElement, 'tab-preview:toggle');
      waitsForPromise(function() {
        return activationPromise;
      });
      return runs(function() {
        var nodeBugElement, nodeBugPanel;
        expect(workspaceElement.querySelector('.tab-preview')).toExist();
        nodeBugElement = workspaceElement.querySelector('.tab-preview');
        expect(nodeBugElement).toExist();
        nodeBugPanel = atom.workspace.panelForItem(nodeBugElement);
        expect(nodeBugPanel.isVisible()).toBe(true);
        atom.commands.dispatch(workspaceElement, 'tab-preview:toggle');
        return expect(nodeBugPanel.isVisible()).toBe(false);
      });
    });
    return it("hides and shows the view", function() {
      jasmine.attachToDOM(workspaceElement);
      expect(workspaceElement.querySelector('.tab-preview')).not.toExist();
      atom.commands.dispatch(workspaceElement, 'tab-preview:toggle');
      waitsForPromise(function() {
        return activationPromise;
      });
      return runs(function() {
        var nodeBugElement;
        nodeBugElement = workspaceElement.querySelector('.tab-preview');
        expect(nodeBugElement).toBeVisible();
        atom.commands.dispatch(workspaceElement, 'tab-preview:toggle');
        return expect(nodeBugElement).not.toBeVisible();
      });
    });
  });
});
