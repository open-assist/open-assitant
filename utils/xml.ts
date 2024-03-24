import { XMLParser, XMLBuilder, type XmlBuilderOptions } from "fast-xml-parser";

/**
 * XML utility class for parsing and stringifying Extensible Markup Language (XML) data.
 * Provides static methods to convert between XML strings and JavaScript objects.
 * Uses the fast-xml-parser library for efficient XML processing.
 */
export class XML {
  /**
   * Parses an XML string into a JavaScript object.
   *
   * @param text The XML string to parse.
   *
   * @returns The parsed JavaScript object.
   */
  // deno-lint-ignore no-explicit-any
  static parse(text: string): any {
    return new XMLParser().parse(text);
  }

  /**
   * Converts a JavaScript object to an XML string.
   *
   * @param value The JavaScript object to convert.
   *
   * @returns The XML string representation of the object.
   */
  // deno-lint-ignore no-explicit-any
  static stringify(value: any, options?: XmlBuilderOptions): string {
    return new XMLBuilder(options).build(value);
  }
}
