// Common helper functions to be used in HighlightRule or HighlightRuleComponent

export function splitCodeAndIndentation(codeStr: string) {
  const codeStartIdx = codeStr.search(/\S|$/);
  const indents = codeStr.substring(0, codeStartIdx);
  const content = codeStr.substring(codeStartIdx);
  return [indents, content];
}

// Define the boundary type
interface Boundary {
  index: number;
  type: BOUNDARY_TYPE;
}

// Define the BOUNDARY_TYPE enum
export enum BOUNDARY_TYPE {
  Start = 'Start',
  End = 'End'
}

// Simplifies multiple bounds applied on a single line to an array of disjointed bounds
// boundaryCollection:
// e.g [{index: 1, type: BOUNDARY_TYPE.Start},
//      {index:3, type: BOUNDARY_TYPE.End},
//      {index: 5, type: BOUNDARY_TYPE.Start},
//      {index: 7, type: BOUNDARY_TYPE.End}]
function collateAllIntervals(boundaryCollection: Boundary[]): [number, number][] {
  let startCount = 0;
  let endCount = 0;
  let boundStart: number = 0;
  let boundEnd: number = 0;
  const output: [number, number][] = [];
  boundaryCollection.sort((boundaryA, boundaryB) => boundaryA.index - boundaryB.index);

  for (let i = 0; i < boundaryCollection.length; i += 1) {
    const currBoundary = boundaryCollection[i];

    if (currBoundary.type === BOUNDARY_TYPE.Start) {
      startCount += 1;
      if (startCount === 1) {
        boundStart = currBoundary.index;
      }
    } else {
      endCount += 1;
      if (endCount === startCount) {
        boundEnd = currBoundary.index;
        if (boundEnd !== boundStart) {
          output.push([boundStart, boundEnd]);
        }
        endCount = 0;
        startCount = 0;
      }
    }
  }
  return output;
}

// console.log(collateAllIntervals([
//   { index: 1, type: BOUNDARY_TYPE.Start },
//   { index: 3, type: BOUNDARY_TYPE.End },
//   { index: 5, type: BOUNDARY_TYPE.Start },
//   { index: 8, type: BOUNDARY_TYPE.End },
//   { index: 7, type: BOUNDARY_TYPE.Start },
//   { index: 13, type: BOUNDARY_TYPE.End },
// ]));

export {
  collateAllIntervals,
};
