// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

/* tslint:disable:no-bitwise */

import * as ts from 'typescript';

import { Span } from './Span';

/**
  * Some helper functions for formatting certain TypeScript Compiler API expressions.
  */
export class PrettyPrinter {
  /**
    * Used for debugging only.  This dumps the TypeScript Compiler's abstract syntax tree.
    */
  public static dumpTree(node: ts.Node, indent: string = ''): void {
    const kindName: string = ts.SyntaxKind[node.kind];
    let trimmedText: string;

    try {
      trimmedText = node.getText()
        .replace(/[\r\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (trimmedText.length > 100) {
        trimmedText = trimmedText.substr(0, 97) + '...';
      }
    } catch (e) {
      trimmedText = '(error getting text)';
    }

    console.log(`${indent}${kindName}: [${trimmedText}]`);

    try {
      for (const childNode of node.getChildren()) {
        PrettyPrinter.dumpTree(childNode, indent + '  ');
      }
    } catch (e) {
      // sometimes getChildren() throws an exception
    }
  }

  /**
   * Returns a text representation of the enum flags.
   */
  public static getSymbolFlagsString(flags: ts.SymbolFlags): string {
    return PrettyPrinter._getFlagsString(flags, PrettyPrinter._getSymbolFlagString);
  }

  /**
   * Returns a text representation of the enum flags.
   */
  public static getTypeFlagsString(flags: ts.TypeFlags): string {
    return PrettyPrinter._getFlagsString(flags, PrettyPrinter._getTypeFlagString);
  }

  /**
    * Returns the first line of a potentially nested declaration.
    * For example, for a class definition this might return
    * "class Blah<T> extends BaseClass" without the curly braces.
    * For example, for a function definition, this might return
    * "test(): void;" without the curly braces.
    */
  public static getDeclarationSummary(node: ts.Node): string {
    const rootSpan: Span = new Span(node);
    rootSpan.forEach((span: Span) => {
      switch (span.kind) {
        case ts.SyntaxKind.JSDocComment:   // strip any code comments
        case ts.SyntaxKind.DeclareKeyword: // strip the "declare" keyword
          span.modification.skipAll();
          break;
      }
    });

    return rootSpan.getModifiedText();
  }

  /**
   * Returns a string such as this, based on the context information in the provided node:
   *   "[C:\Folder\File.ts#123]"
   */
  public static formatFileAndLineNumber(node: ts.Node): string {
    const sourceFile: ts.SourceFile = node.getSourceFile();
    const lineAndCharacter: ts.LineAndCharacter = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    return `[${sourceFile.fileName}#${lineAndCharacter.line}]`;
  }

  private static _getSymbolFlagString(flag: ts.SymbolFlags): string {
    return ts.SymbolFlags[flag];
  }

  private static _getTypeFlagString(flag: ts.TypeFlags): string {
    return ts.TypeFlags[flag];
  }

  private static _getFlagsString<T>(flags: T, func: (x: T) => string): string {
    /* tslint:disable:no-any */
    let result: string = '';

    let flag: number = 1;
    for (let bit: number = 0; bit < 32; ++bit) {
      if ((flags as any as number) & flag) {
        if (result !== '') {
          result += ', ';
        }
        result += func(flag as any as T);
      }
      flag <<= 1;
    }
    return result === '' ? '???' : result;
    /* tslint:enable:no-any */
  }

}
