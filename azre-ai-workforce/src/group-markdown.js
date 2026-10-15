import MarkdownIt from 'markdown-it';
const md=new MarkdownIt({html:false,linkify:false}).disable(['image','link']);
export const groupMarkdown=text=>md.render(text);
