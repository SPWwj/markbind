import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import { NodeOrText } from '../utils/node';
import emojiData from '../../src/lib/markdown-it/patches/markdown-it-emoji-fixed';
import octicons, { IconName as OctName } from '@primer/octicons';

interface IconAttributes {
  icon?: string;
  className?: string;
  width?: string;
  height?: string;
}

type Size = {
  fontSize: string;
  width: string;
  height: string;
};

function updateNodeRelations(iChild: NodeOrText, divChild: NodeOrText, children: NodeOrText[]): void {
  iChild.next = divChild;
  divChild.prev = iChild;

  children.forEach((child) => {
    child.parent = divChild;
  });
}

function getStyleObject(node: NodeOrText): { [key: string]: string } {
  let styleObject: { [key: string]: string } = {};
  if (node.attribs?.style) {
    const { style } = node.attribs;
    styleObject = style.split(';').reduce((acc: Record<string, string>, rule: string) => {
      const [property, value] = rule.split(':').map((str: string) => str.trim());
      if (property) acc[property] = value;
      return acc;
    }, {});
  }
  return styleObject;
}

function createStyleString(styleObject: { [key: string]: string }): string {
  return Object.entries(styleObject).map(
    ([property, value]: [string, string]) => `${property}: ${value}`).join('; ');
}
function classifyIcon(icon: string) {
  const isEmoji = Object.prototype.hasOwnProperty.call(emojiData, icon);
  const localFileRegex = /^(\.\/)?[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+\.(jpg|png|gif|bmp|svg|jpeg)$/;
  const urlRegex = /^(http(s)?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
  const isImage = !isEmoji && (localFileRegex.test(icon) || urlRegex.test(icon));

  let iconClass;
  let iconName;
  let isOcticon = false;
  let octiconColor = undefined;
  let octiconClass = undefined;
  if (!isEmoji && !isImage) {
    const materialIconsRegex = /^(mif|mio|mir|mis|mit)-(.*)/;
    const octiconRegex = /^(octiconlight-octicon-|octicon-)([a-z-]+)(~[\w-]+)?/;
    const materialIconsMatch = icon.match(materialIconsRegex);
    const octiconMatch = icon.match(octiconRegex);
    if (materialIconsMatch) {
      const [, prefix, name] = materialIconsMatch;
      switch (prefix) {
        case 'mif':
          iconClass = 'material-icons align-middle';
          break;
        case 'mio':
          iconClass = 'material-icons-outlined align-middle';
          break;
        case 'mir':
          iconClass = 'material-icons-round align-middle';
          break;
        case 'mis':
          iconClass = 'material-icons-sharp align-middle';
          break;
        case 'mit':
          iconClass = 'material-icons-two-tone align-middle';
          break;
      }
      iconName = name.replace(/-/g, '_');
    } else if (octiconMatch) {
      const [, prefix, name, classMatch] = octiconMatch;
      isOcticon = true;
      iconName = name;
      octiconClass = classMatch ? classMatch.slice(1) : undefined;
      octiconColor = prefix === 'octiconlight-octicon-' ? '#fff' : undefined;
    } else {
      const prefixRegex = /^(fas-|far-|fab-|glyphicon-)/;
      if (prefixRegex.test(icon)) {
        iconClass = icon.replace(prefixRegex, (match, p1) => {
          switch (p1) {
            case 'glyphicon-':
              return 'glyphicon ' + match;
            default:
              return p1.slice(0, -1) + ' ';
          }
        });
      } else {
        // if the icon does not match any category, return it as it is
        iconClass = icon;
      }
    }
  }

  return { isEmoji, isImage, unicodeEmoji: isEmoji ? emojiData[icon] : undefined, iconClass, iconName, isOcticon, octiconColor, octiconClass };
}





function getOcticonIcon(iconName: string) {
  return octicons[iconName as OctName] ?? null;
}



function createIChild(
  parent: NodeOrText,
  icon: string,
  size: Size,
  className?: string,
): NodeOrText {
  const { isEmoji, isImage, unicodeEmoji, iconClass, iconName, isOcticon, octiconColor, octiconClass } = classifyIcon(icon);
  icon = iconClass || icon;

  let child: NodeOrText;
  const defaultSize = `width: ${size.width}; height: ${size.height}; 
          margin-right:5px;text-align:center;display:flex;align-items:center;`;

  if (isEmoji) {
    child = {
      type: 'tag',
      name: 'span',
      attribs: {
        ...className && { class: className },
        'aria-hidden': 'true',
        style: `${defaultSize}${size.fontSize ? `font-size:${size.fontSize};
        margin-right: 5px;` : 'margin-right: 5px;'}`,
      },
      children: [
        {
          type: 'text',
          data: unicodeEmoji,
        },
      ],
      next: undefined,
      prev: undefined,
      parent,
    };
  } else if (isImage) {
    const altText = icon.split('/').pop()?.split('.')[0] || '';
    const divNode: NodeOrText = {
      type: 'tag',
      name: 'div',
      attribs: {
        style: 'padding: 0.2rem;',
      },
      children: [],
      next: undefined,
      prev: undefined,
      parent,
    };

    const imgNode: NodeOrText = {
      type: 'tag',
      name: 'img',
      attribs: {
        ...className && { class: className },
        src: icon,
        alt: altText,
        style: defaultSize,
      },
      children: [],
      next: undefined,
      prev: undefined,
      parent: divNode,
    };
    divNode.children?.push(imgNode);
    child = divNode;
  } else if (isOcticon) {
    const octiconIcon = getOcticonIcon(iconName!);
    let svgStr = octiconIcon.toSVG({
      class: octiconClass ? `${iconClass} ${octiconClass} ${className}` : `${iconClass} ${className}`,
    });

    if (octiconColor) {
      svgStr = svgStr.replace('<path', `<path fill="${octiconColor}"`);
    }
    child = {
      type: 'tag',
      name: 'span',
      attribs: {
        'aria-hidden': 'true',
        style: `${defaultSize}margin-right:5px;${size.fontSize ? `font-size:${size.fontSize};` : ''}`,
      },
      children: [
        {
          type: 'text',
          data: svgStr,
        },
      ],
      next: undefined,
      prev: undefined,
      parent,
    };
  } else {
    child = {
      type: 'tag',
      name: 'span',
      attribs: {
        class: className ? `${icon} ${className}` : icon,
        'aria-hidden': 'true',
        style: `${defaultSize}margin-right:5px;${size.fontSize ? `font-size:${size.fontSize};` : ''}`,
      },
      children: iconName ? [{
        type: 'text',
        data: iconName,
      }] : [],
      next: undefined,
      prev: undefined,
      parent,
    };
  }
  return child;
}

function getSize(width: string, height: string) {
  width = width || height || '25px';
  height = height || width || '25px';
  const sizeUnitRegexp = /(\d+)(px|em|rem|%|vw|vh|vmin|vmax|ex|ch)/;
  let widthMatch = width.match(sizeUnitRegexp);
  let heightMatch = height.match(sizeUnitRegexp);

  if (!widthMatch || !heightMatch) {
    throw new Error("Invalid width or height format. Expected format is number followed by unit (px|em|rem|%|vw|vh|vmin|vmax|ex|ch).");
  }

  // Ensure both width and height are using the same unit
  if (widthMatch[2] !== heightMatch[2]) {
    throw new Error("The units of width and height should be the same.");
  }

  let fontSize = Math.min(parseFloat(widthMatch[1]), parseFloat(heightMatch[1]));

  // Assuming the single character font will take up approximately 70% of the container's smaller dimension
  fontSize *= 0.7;

  return {
    fontSize: `${fontSize}${widthMatch[2]}`, // fontSize in the same unit as width and height
    width: width,
    height: height,
  };
}

function createDivChild(parent: NodeOrText, children: NodeOrText[]): NodeOrText {
  return {
    type: 'tag',
    name: 'div',
    attribs: {},
    children,
    next: undefined,
    prev: undefined,
    parent,
  };
}

function updateNodeStyle(node: NodeOrText) {
  const styleObject = getStyleObject(node);
  styleObject['list-style-type'] = 'none';
  styleObject['padding-left'] = '0';
  if (!node.attribs) node.attribs = {};

  node.attribs.style = createStyleString(styleObject);
}

function updateLiChildren(child: NodeOrText, parentIconAttributes:
  IconAttributes, defaultLiIconAttributes: IconAttributes) {
  const icon = child.attribs?.icon || parentIconAttributes.icon || defaultLiIconAttributes.icon;
  const width = child.attribs?.width || parentIconAttributes.width || defaultLiIconAttributes.width;
  const height = child.attribs?.height || parentIconAttributes.height || defaultLiIconAttributes.height;
  const className = child.attribs?.class
    || parentIconAttributes.className
    || defaultLiIconAttributes.className;

  if (child.attribs?.icon) delete child.attribs.icon;
  if (child.attribs?.size) delete child.attribs.size;
  if (child.attribs?.class) delete child.attribs.class;

  const size = getSize(width, height);

  const iChild: NodeOrText = createIChild(child, icon, size, className);
  const divChild: NodeOrText = createDivChild(child, child.children || []);
  child.children = [iChild, divChild];
  updateNodeRelations(iChild, divChild, child.children || []);
  if (!child.attribs) child.attribs = {};
  child.attribs.style = 'display: flex;';
}

export function processUlNode(node: NodeOrText): NodeOrText {
  const iconUl = node.attribs?.icon;
  const hasIconInChildren = node.children?.find(
    (child: NodeOrText) => child.name === 'li' && child.attribs?.icon,
  );
  if (iconUl === undefined && hasIconInChildren === undefined) return node;

  if ('name' in node && node.name === 'ul') {
    const iconAttributes: IconAttributes = {
      icon: iconUl,
      width: node.attribs?.width,
      height: node.attribs?.height,
      className: node.attribs?.class,
    };

    if (iconAttributes.icon) delete node.attribs?.icon;
    if (iconAttributes.width) delete node.attribs?.width;
    if (iconAttributes.height) delete node.attribs?.height;
    if (iconAttributes.className) delete node.attribs?.class;

    let defaultLiIcon: IconAttributes = {};
    if (hasIconInChildren) {
      defaultLiIcon = {
        icon: hasIconInChildren.attribs?.icon,
        width: hasIconInChildren.attribs?.width,
        height: hasIconInChildren.attribs?.height,
        className: hasIconInChildren.attribs?.class,
      };
    }

    if (iconAttributes.icon || hasIconInChildren) {
      updateNodeStyle(node);
      node.children = node.children?.map((child: NodeOrText) => {
        if (child.name === 'li') {
          updateLiChildren(child, iconAttributes, defaultLiIcon);
        }
        return child;
      }) || [];
    }
  }
  return node;
}