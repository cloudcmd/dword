import clipboard from '@cloudcmd/clipboard';
import createElement from '@cloudcmd/create-element';
import once from 'once';
import _showMessageOnce from './show-message.js';

const resolve = Promise.resolve.bind(Promise);
const reject = Promise.reject.bind(Promise);
const showMessageOnce = once(_showMessageOnce);

export default (cmd) => {
    const NAME = 'editor-clipboard';
    const {_Ace, _story} = this;
    
    const value = _Ace.getSelection('\n');
    const insert = (a) => _Ace
        .getDoc()
        .replaceSelection(a);
    
    if (cmd === 'copy') {
        _story.setData(NAME, value);
        return clipboard.writeText(value);
    }
    
    if (cmd === 'cut') {
        _story.setData(NAME, value);
        return cut(value) ? resolve() : reject();
    }
    
    return clipboard
        .readText()
        .then(insert)
        .catch(() => {
            showMessageOnce('Could not paste from clipboard. Inner buffer used.');
            
            const value = _story.getData(NAME);
            
            insert(value);
        });
};

function cut(value) {
    const textarea = createElement('textarea', {
        value,
    });
    
    textarea.select();
    
    const result = document.execCommand('cut');
    
    document.body.removeChild(textarea);
    
    return result;
}
