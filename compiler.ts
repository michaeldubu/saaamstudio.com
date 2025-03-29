/**
 * SAAAM Language Compiler
 * Compiles SAAAM code to JavaScript for execution in the SAAAM game engine
 */

// Token type definition
interface Token {
  type: string;
  value: string;
  position: number;
}

// Token type definition with regex
interface TokenType {
  type: string;
  regex: RegExp;
  ignore?: boolean;
  multiline?: boolean;
}

// AST node interface
interface ASTNode {
  type: string;
  [key: string]: any;
}

export class SaaamCompiler {
  private tokens: Token[] = [];
  private ast: ASTNode | null = null;
  private currentToken: number = 0;
  private errors: string[] = [];
  private warnings: string[] = [];

  // Predefined variables and function names in the SAAAM language
  private predefinedVariables: string[] = [
    "position", "velocity", "size", "color",
    "rotation", "scale", "visible", "active",
    "tag", "components", "GRAVITY", "FRICTION", 
    "MAX_FALL_SPEED", "delta_time", "current_time", "game_time"
  ];

  private predefinedFunctions: string[] = [
    "create", "step", "draw", "on_collision",
    "keyboard_check", "keyboard_check_pressed", "keyboard_check_released",
    "mouse_check", "mouse_check_pressed", "mouse_check_released",
    "draw_sprite", "draw_text", "draw_rectangle", "draw_circle", "draw_line",
    "play_sound", "play_music", "stop_sound", "stop_music",
    "vec2", "vec3", "point_distance", "check_collision",
    "create_object", "destroy_object", "find_object", "find_nearest"
  ];

  /**
   * Initialize the SAAAM compiler
   */
  constructor() {
    console.log("SaaamCompiler initialized");
  }

  /**
   * Clear any existing errors and warnings
   */
  private reset(): void {
    this.tokens = [];
    this.ast = null;
    this.currentToken = 0;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Add an error message
   */
  private addError(message: string): void {
    this.errors.push(message);
  }

  /**
   * Add a warning message
   */
  private addWarning(message: string): void {
    this.warnings.push(message);
  }

  /**
   * Tokenize the input SAAAM code
   * @param code - The SAAAM code to tokenize
   * @returns Array of tokens
   */
  tokenize(code: string): Token[] {
    const tokenTypes: TokenType[] = [
      // Keywords
      {
        type: "KEYWORD",
        regex: /\b(var|const|let|function|if|else|for|while|do|switch|case|break|continue|return|this|new|true|false|null|undefined)\b/,
      },
      // Special SAAAM keywords
      { 
        type: "SAAAM_KEYWORD", 
        regex: /\b(vec2|vec3|yield|signal|state|create|step|draw|on_collision)\b/ 
      },
      // Identifiers
      { 
        type: "IDENTIFIER", 
        regex: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/ 
      },
      // Numbers
      { 
        type: "NUMBER", 
        regex: /\b\d+(\.\d+)?(e[+-]?\d+)?\b/ 
      },
      // Strings
      { 
        type: "STRING", 
        regex: /'([^'\\]|\\.)*'|"([^"\\]|\\.)*"/ 
      },
      // Operators
      { 
        type: "OPERATOR", 
        regex: /[+\-*/=<>!&|^%]=?|&&|\|\||[?:]|\.\.\./ 
      },
      // Punctuation
      { 
        type: "PUNCTUATION", 
        regex: /[.,;()]/ 
      },
      // Brackets
      { 
        type: "BRACKET", 
        regex: /[[\]{}]/ 
      },
      // Whitespace (ignored)
      { 
        type: "WHITESPACE", 
        regex: /\s+/, 
        ignore: true 
      },
      // Comments (ignored)
      { 
        type: "COMMENT", 
        regex: /\/\/.*$|\/\*[\s\S]*?\*\//, 
        ignore: true, 
        multiline: true 
      },
    ];

    this.tokens = [];
    let remaining = code;
    let position = 0;

    while (remaining.length > 0) {
      let match: RegExpMatchArray | null = null;
      let matchedType: TokenType | null = null;

      for (const tokenType of tokenTypes) {
        const regex = new RegExp("^" + tokenType.regex.source, tokenType.multiline ? "m" : "");
        match = remaining.match(regex);

        if (match) {
          matchedType = tokenType;
          break;
        }
      }

      if (!match || !matchedType) {
        // Try to recover by skipping the problematic character
        const errorChar = remaining.charAt(0);
        this.addError(`Unexpected character at position ${position}: '${errorChar}'`);
        remaining = remaining.slice(1);
        position += 1;
        continue;
      }

      const tokenValue = match[0];

      if (!matchedType.ignore) {
        this.tokens.push({
          type: matchedType.type,
          value: tokenValue,
          position: position,
        });
      }

      remaining = remaining.slice(tokenValue.length);
      position += tokenValue.length;
    }

    // Add EOF token
    this.tokens.push({
      type: "EOF",
      value: "",
      position: code.length,
    });

    return this.tokens;
  }

  /**
   * Parse tokens into an abstract syntax tree (AST)
   * @returns The root node of the AST
   */
  parse(): ASTNode | null {
    this.currentToken = 0;
    
    try {
      this.ast = this.parseProgram();
      return this.ast;
    } catch (error) {
      if (error instanceof Error) {
        this.addError(`Parsing error: ${error.message}`);
      } else {
        this.addError(`Parsing error: ${String(error)}`);
      }
      return null;
    }
  }

  /**
   * Parse a full SAAAM program
   * @returns Program AST node
   */
  private parseProgram(): ASTNode {
    const body: ASTNode[] = [];

    while (this.peek().type !== "EOF") {
      try {
        // Parse variable declarations and function definitions
        if (this.match("KEYWORD", "var") || this.match("KEYWORD", "const") || this.match("KEYWORD", "let")) {
          body.push(this.parseVariableDeclaration());
        } else if (this.match("KEYWORD", "function")) {
          body.push(this.parseFunctionDefinition());
        } else {
          body.push(this.parseStatement());
        }
      } catch (error) {
        // Try to recover by skipping to the next statement
        if (error instanceof Error) {
          this.addError(`Parse error: ${error.message}`);
        }
        
        // Skip tokens until we find a semicolon or bracket
        while (
          !this.match("PUNCTUATION", ";") && 
          !this.match("BRACKET", "}") && 
          this.peek().type !== "EOF"
        ) {
          this.consume();
        }
        
        // Consume the semicolon or closing bracket if found
        if (this.match("PUNCTUATION", ";") || this.match("BRACKET", "}")) {
          this.consume();
        }
      }
    }

    return {
      type: "Program",
      body,
    };
  }

  /**
   * Parse a variable declaration
   * @returns Variable declaration AST node
   */
  private parseVariableDeclaration(): ASTNode {
    const kind = this.consume().value; // 'var', 'const', or 'let'
    const identifier = this.consume("IDENTIFIER").value;

    let init: ASTNode | null = null;
    if (this.match("OPERATOR", "=")) {
      this.consume(); // Consume '='
      init = this.parseExpression();
    }

    // Make semicolons optional - add warning instead of error
    if (this.match("PUNCTUATION", ";")) {
      this.consume();
    } else {
      this.addWarning(`Missing semicolon after variable declaration for '${identifier}'`);
    }

    return {
      type: "VariableDeclaration",
      kind,
      identifier,
      init,
    };
  }

  /**
   * Parse a function definition
   * @returns Function definition AST node
   */
  private parseFunctionDefinition(): ASTNode {
    this.consume("KEYWORD", "function");
    const name = this.consume("IDENTIFIER").value;

    this.consume("PUNCTUATION", "(");
    const params: string[] = [];

    if (!this.match("PUNCTUATION", ")")) {
      do {
        params.push(this.consume("IDENTIFIER").value);
      } while (this.match("PUNCTUATION", ",") && this.consume());
    }

    this.consume("PUNCTUATION", ")");
    const body = this.parseBlock();

    // Check if this is a SAAAM lifecycle function
    if (["create", "step", "draw", "on_collision"].includes(name)) {
      // Validate parameters for lifecycle functions
      if (name === "step" && params.length === 0) {
        this.addWarning(`The 'step' function should have a 'deltaTime' parameter for time-based movement`);
      }
      
      if (name === "draw" && params.length === 0) {
        this.addWarning(`The 'draw' function should have a 'ctx' parameter for drawing context`);
      }
    }

    return {
      type: "FunctionDefinition",
      name,
      params,
      body,
    };
  }

  /**
   * Parse a code block
   * @returns Block AST node
   */
  private parseBlock(): ASTNode {
    this.consume("BRACKET", "{");
    const statements: ASTNode[] = [];

    while (!this.match("BRACKET", "}") && this.peek().type !== "EOF") {
      statements.push(this.parseStatement());
    }

    if (this.peek().type === "EOF") {
      this.addError("Unexpected end of file, expected '}'");
      throw new Error("Unexpected end of file");
    }

    this.consume("BRACKET", "}");

    return {
      type: "Block",
      statements,
    };
  }

  /**
   * Parse a statement
   * @returns Statement AST node
   */
  private parseStatement(): ASTNode {
    // Variable declarations inside blocks
    if (this.match("KEYWORD", "var") || this.match("KEYWORD", "const") || this.match("KEYWORD", "let")) {
      return this.parseVariableDeclaration();
    }
    
    // Handle if statements
    if (this.match("KEYWORD", "if")) {
      return this.parseIfStatement();
    }

    // Handle for loops
    if (this.match("KEYWORD", "for")) {
      return this.parseForLoop();
    }

    // Handle while loops
    if (this.match("KEYWORD", "while")) {
      return this.parseWhileLoop();
    }

    // Handle do-while loops
    if (this.match("KEYWORD", "do")) {
      return this.parseDoWhileLoop();
    }

    // Handle switch statements
    if (this.match("KEYWORD", "switch")) {
      return this.parseSwitchStatement();
    }

    // Handle return statements
    if (this.match("KEYWORD", "return")) {
      return this.parseReturnStatement();
    }

    // Handle break statements
    if (this.match("KEYWORD", "break")) {
      return this.parseBreakStatement();
    }

    // Handle continue statements
    if (this.match("KEYWORD", "continue")) {
      return this.parseContinueStatement();
    }

    // Handle block statements (grouped in braces)
    if (this.match("BRACKET", "{")) {
      return this.parseBlock();
    }

    // Empty statement (just a semicolon)
    if (this.match("PUNCTUATION", ";")) {
      this.consume();
      return {
        type: "EmptyStatement"
      };
    }

    // Default: expression statement
    const expr = this.parseExpression();

    // Make semicolons optional - add warning instead of error
    if (this.match("PUNCTUATION", ";")) {
      this.consume();
    } else {
      this.addWarning(`Missing semicolon after expression`);
    }

    return {
      type: "ExpressionStatement",
      expression: expr,
    };
  }

  /**
   * Parse an if statement
   * @returns If statement AST node
   */
  private parseIfStatement(): ASTNode {
    this.consume("KEYWORD", "if");
    this.consume("PUNCTUATION", "(");
    const condition = this.parseExpression();
    this.consume("PUNCTUATION", ")");

    const consequent = this.parseStatement();
    let alternate: ASTNode | null = null;

    if (this.match("KEYWORD", "else")) {
      this.consume();
      alternate = this.parseStatement();
    }

    return {
      type: "IfStatement",
      condition,
      consequent,
      alternate,
    };
  }

  /**
   * Parse a for loop
   * @returns For loop AST node
   */
  private parseForLoop(): ASTNode {
    this.consume("KEYWORD", "for");
    this.consume("PUNCTUATION", "(");

    let init: ASTNode | null = null;
    if (!this.match("PUNCTUATION", ";")) {
      if (this.match("KEYWORD", "var") || this.match("KEYWORD", "const") || this.match("KEYWORD", "let")) {
        init = this.parseVariableDeclaration();
      } else {
        init = this.parseExpression();
        this.consume("PUNCTUATION", ";");
      }
    } else {
      this.consume("PUNCTUATION", ";");
    }

    let condition: ASTNode | null = null;
    if (!this.match("PUNCTUATION", ";")) {
      condition = this.parseExpression();
    } else {
      // No condition specified, default to true
      condition = {
        type: "Literal",
        value: true
      };
    }
    this.consume("PUNCTUATION", ";");

    let update: ASTNode | null = null;
    if (!this.match("PUNCTUATION", ")")) {
      update = this.parseExpression();
    }
    this.consume("PUNCTUATION", ")");

    const body = this.parseStatement();

    return {
      type: "ForLoop",
      init,
      condition,
      update,
      body,
    };
  }

  /**
   * Parse a while loop
   * @returns While loop AST node
   */
  private parseWhileLoop(): ASTNode {
    this.consume("KEYWORD", "while");
    this.consume("PUNCTUATION", "(");
    const condition = this.parseExpression();
    this.consume("PUNCTUATION", ")");

    const body = this.parseStatement();

    return {
      type: "WhileLoop",
      condition,
      body,
    };
  }

  /**
   * Parse a do-while loop
   * @returns Do-while loop AST node
   */
  private parseDoWhileLoop(): ASTNode {
    this.consume("KEYWORD", "do");
    const body = this.parseStatement();
    
    this.consume("KEYWORD", "while");
    this.consume("PUNCTUATION", "(");
    const condition = this.parseExpression();
    this.consume("PUNCTUATION", ")");

    // Semicolon is required for do-while loops
    if (this.match("PUNCTUATION", ";")) {
      this.consume();
    } else {
      this.addWarning("Missing semicolon after do-while statement");
    }

    return {
      type: "DoWhileLoop",
      body,
      condition
    };
  }

  /**
   * Parse a switch statement
   * @returns Switch statement AST node
   */
  private parseSwitchStatement(): ASTNode {
    this.consume("KEYWORD", "switch");
    this.consume("PUNCTUATION", "(");
    const discriminant = this.parseExpression();
    this.consume("PUNCTUATION", ")");
    
    this.consume("BRACKET", "{");
    
    const cases: ASTNode[] = [];
    let defaultCase: ASTNode | null = null;
    
    while (!this.match("BRACKET", "}") && this.peek().type !== "EOF") {
      if (this.match("KEYWORD", "case")) {
        this.consume();
        const test = this.parseExpression();
        this.consume("PUNCTUATION", ":");
        
        const consequent: ASTNode[] = [];
        while (!this.match("KEYWORD", "case") && 
               !this.match("KEYWORD", "default") && 
               !this.match("BRACKET", "}") && 
               this.peek().type !== "EOF") {
          consequent.push(this.parseStatement());
        }
        
        cases.push({
          type: "SwitchCase",
          test,
          consequent
        });
      } else if (this.match("KEYWORD", "default")) {
        this.consume();
        this.consume("PUNCTUATION", ":");
        
        const consequent: ASTNode[] = [];
        while (!this.match("KEYWORD", "case") && 
               !this.match("BRACKET", "}") && 
               this.peek().type !== "EOF") {
          consequent.push(this.parseStatement());
        }
        
        defaultCase = {
          type: "SwitchCase",
          test: null,
          consequent
        };
      } else {
        this.addError("Expected 'case' or 'default' in switch statement");
        this.consume(); // Skip token to try recovery
      }
    }
    
    if (defaultCase) {
      cases.push(defaultCase);
    }
    
    this.consume("BRACKET", "}");
    
    return {
      type: "SwitchStatement",
      discriminant,
      cases
    };
  }

  /**
   * Parse a return statement
   * @returns Return statement AST node
   */
  private parseReturnStatement(): ASTNode {
    this.consume("KEYWORD", "return");
    let argument: ASTNode | null = null;

    if (!this.match("PUNCTUATION", ";") && !this.match("BRACKET", "}")) {
      argument = this.parseExpression();
    }

    // Make semicolons optional - add warning instead of error
    if (this.match("PUNCTUATION", ";")) {
      this.consume();
    } else if (!this.match("BRACKET", "}")) {
      this.addWarning("Missing semicolon after return statement");
    }

    return {
      type: "ReturnStatement",
      argument,
    };
  }

  /**
   * Parse a break statement
   * @returns Break statement AST node
   */
  private parseBreakStatement(): ASTNode {
    this.consume("KEYWORD", "break");
    
    // Make semicolons optional - add warning instead of error
    if (this.match("PUNCTUATION", ";")) {
      this.consume();
    } else {
      this.addWarning("Missing semicolon after break statement");
    }
    
    return {
      type: "BreakStatement"
    };
  }

  /**
   * Parse a continue statement
   * @returns Continue statement AST node
   */
  private parseContinueStatement(): ASTNode {
    this.consume("KEYWORD", "continue");
    
    // Make semicolons optional - add warning instead of error
    if (this.match("PUNCTUATION", ";")) {
      this.consume();
    } else {
      this.addWarning("Missing semicolon after continue statement");
    }
    
    return {
      type: "ContinueStatement"
    };
  }

  /**
   * Parse an expression
   * @returns Expression AST node
   */
  private parseExpression(): ASTNode {
    return this.parseAssignment();
  }

  /**
   * Parse an assignment expression
   * @returns Assignment expression AST node
   */
  private parseAssignment(): ASTNode {
    const left = this.parseLogicalOr();

    if (this.match("OPERATOR", "=") || 
        this.match("OPERATOR", "+=") || 
        this.match("OPERATOR", "-=") || 
        this.match("OPERATOR", "*=") || 
        this.match("OPERATOR", "/=") || 
        this.match("OPERATOR", "%=")) {
      const operator = this.consume().value;
      const right = this.parseAssignment();

      return {
        type: "AssignmentExpression",
        operator,
        left,
        right,
      };
    }

    return left;
  }

  /**
   * Parse a logical OR expression
   * @returns Logical OR expression AST node
   */
  private parseLogicalOr(): ASTNode {
    let left = this.parseLogicalAnd();

    while (this.match("OPERATOR", "||")) {
      this.consume();
      const right = this.parseLogicalAnd();

      left = {
        type: "BinaryExpression",
        operator: "||",
        left,
        right,
      };
    }

    return left;
  }

  /**
   * Parse a logical AND expression
   * @returns Logical AND expression AST node
   */
  private parseLogicalAnd(): ASTNode {
    let left = this.parseEquality();

    while (this.match("OPERATOR", "&&")) {
      this.consume();
      const right = this.parseEquality();

      left = {
        type: "BinaryExpression",
        operator: "&&",
        left,
        right,
      };
    }

    return left;
  }

  /**
   * Parse an equality expression
   * @returns Equality expression AST node
   */
  private parseEquality(): ASTNode {
    let left = this.parseComparison();

    while (this.match("OPERATOR", "==") || this.match("OPERATOR", "!=")) {
      const operator = this.consume().value;
      const right = this.parseComparison();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right,
      };
    }

    return left;
  }

  /**
   * Parse a comparison expression
   * @returns Comparison expression AST node
   */
  private parseComparison(): ASTNode {
    let left = this.parseAdditive();

    while (
      this.match("OPERATOR", ">") ||
      this.match("OPERATOR", ">=") ||
      this.match("OPERATOR", "<") ||
      this.match("OPERATOR", "<=")
    ) {
      const operator = this.consume().value;
      const right = this.parseAdditive();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right,
      };
    }

    return left;
  }

  /**
   * Parse an additive expression
   * @returns Additive expression AST node
   */
  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();

    while (this.match("OPERATOR", "+") || this.match("OPERATOR", "-")) {
      const operator = this.consume().value;
      const right = this.parseMultiplicative();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right,
      };
    }

    return left;
  }

  /**
   * Parse a multiplicative expression
   * @returns Multiplicative expression AST node
   */
  private parseMultiplicative(): ASTNode {
    let left = this.parseUnary();

    while (this.match("OPERATOR", "*") || this.match("OPERATOR", "/") || this.match("OPERATOR", "%")) {
      const operator = this.consume().value;
      const right = this.parseUnary();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right,
      };
    }

    return left;
  }

  /**
   * Parse a unary expression
   * @returns Unary expression AST node
   */
  private parseUnary(): ASTNode {
    if (this.match("OPERATOR", "-") || this.match("OPERATOR", "!") || this.match("OPERATOR", "+")) {
      const operator = this.consume().value;
      const argument = this.parseUnary();

      return {
        type: "UnaryExpression",
        operator,
        argument,
      };
    }

    return this.parseCallOrMember();
  }

  /**
   * Parse a member or call expression
   * @returns Call or member expression AST node
   */
  private parseCallOrMember(): ASTNode {
    let expression = this.parsePrimary();

    while (true) {
      if (this.match("PUNCTUATION", "(")) {
        expression = this.parseCallExpression(expression);
      } else if (this.match("PUNCTUATION", ".")) {
        expression = this.parseMemberExpression(expression);
      } else if (this.match("BRACKET", "[")) {
        expression = this.parseIndexExpression(expression);
      } else {
        break;
      }
    }

    return expression;
  }

  /**
   * Parse a call expression
   * @param callee - The function being called
   * @returns Call expression AST node
   */
  private parseCallExpression(callee: ASTNode): ASTNode {
    this.consume("PUNCTUATION", "(");
    const args: ASTNode[] = [];

    if (!this.match("PUNCTUATION", ")")) {
      do {
        args.push(this.parseExpression());
      } while (this.match("PUNCTUATION", ",") && this.consume());
    }

    this.consume("PUNCTUATION", ")");

    // Special validation for SAAAM built-in functions
    if (callee.type === "Identifier") {
      const funcName = callee.name;
      
      // Check keyboard_check* functions
      if (
        (funcName === "keyboard_check" || 
         funcName === "keyboard_check_pressed" ||
         funcName === "keyboard_check_released") && 
        args.length !== 1
      ) {
        this.addWarning(`${funcName} expects exactly 1 argument (key code)`);
      }
      
      // Check draw_* functions
      if (funcName === "draw_sprite" && args.length < 3) {
        this.addWarning(`draw_sprite requires at least 3 arguments (sprite, x, y)`);
      }
      
      if (funcName === "draw_text" && args.length < 3) {
        this.addWarning(`draw_text requires at least 3 arguments (text, x, y)`);
      }
    }

    return {
      type: "CallExpression",
      callee,
      arguments: args,
    };
  }

  /**
   * Parse a member expression
   * @param object - The object being accessed
   * @returns Member expression AST node
   */
  private parseMemberExpression(object: ASTNode): ASTNode {
    this.consume("PUNCTUATION", ".");
    const property = this.consume("IDENTIFIER").value;

    return {
      type: "MemberExpression",
      object,
      property,
      computed: false
    };
  }

  /**
   * Parse an index expression (arr[idx])
   * @param object - The object being indexed
   * @returns Member expression AST node with computed=true
   */
  private parseIndexExpression(object: ASTNode): ASTNode {
    this.consume("BRACKET", "[");
    const property = this.parseExpression();
    this.consume("BRACKET", "]");

    return {
      type: "MemberExpression",
      object,
      property,
      computed: true
    };
  }

  /**
   * Parse object literal
   */
  private parseObjectLiteral(): ASTNode {
    this.consume("BRACKET", "{");
    const properties: ASTNode[] = [];

    while (!this.match("BRACKET", "}") && this.peek().type !== "EOF") {
      // Property key
      let key: string | ASTNode;
      let computed = false;
      
      if (this.match("BRACKET", "[")) {
        // Computed property name
        this.consume("BRACKET", "[");
        key = this.parseExpression();
        this.consume("BRACKET", "]");
        computed = true;
      } else if (this.match("IDENTIFIER")) {
        // Regular property name
        key = this.consume("IDENTIFIER").value;
      } else if (this.match("STRING")) {
        // String literal property name
        const token = this.consume("STRING");
        key = token.value.substring(1, token.value.length - 1); // Strip quotes
      } else {
        this.addError("Expected property name in object literal");
        if (this.match("PUNCTUATION", ",")) this.consume();
        continue;
      }
      
      // Property value
      let value: ASTNode;
      
      if (this.match("PUNCTUATION", ":")) {
        // Key-value property
        this.consume("PUNCTUATION", ":");
        value = this.parseExpression();
      } else if (!computed && typeof key === 'string') {
        // Shorthand property (ES6): { x } => { x: x }
        value = {
          type: "Identifier",
          name: key
        };
      } else {
        this.addError("Expected ':' after property name in object literal");
        if (this.match("PUNCTUATION", ",")) this.consume();
        continue;
      }
      
      properties.push({
        type: "Property",
        key: typeof key === 'string' ? { type: "Identifier", name: key } : key,
        value,
        computed
      });
      
      if (this.match("PUNCTUATION", ",")) {
        this.consume();
      } else if (!this.match("BRACKET", "}")) {
        this.addWarning("Expected ',' after property in object literal");
      }
    }

    this.consume("BRACKET", "}");
    
    return {
      type: "ObjectExpression",
      properties
    };
  }

  /**
   * Parse array literal
   */
  private parseArrayLiteral(): ASTNode {
    this.consume("BRACKET", "[");
    const elements: (ASTNode | null)[] = [];

    while (!this.match("BRACKET", "]") && this.peek().type !== "EOF") {
      if (this.match("PUNCTUATION", ",")) {
        // Handle empty elements: [1,,3]
        this.consume();
        elements.push(null);
      } else {
        elements.push(this.parseExpression());
        
        if (this.match("PUNCTUATION", ",")) {
          this.consume();
        } else if (!this.match("BRACKET", "]")) {
          this.addWarning("Expected ',' after array element");
        }
      }
    }

    this.consume("BRACKET", "]");
    
    return {
      type: "ArrayExpression",
      elements
    };
  }

  /**
   * Parse a primary expression
   * @returns Primary expression AST node
   */
  private parsePrimary(): ASTNode {
    if (this.match("KEYWORD", "this")) {
      this.consume();
      return {
        type: "ThisExpression",
      };
    }

    if (this.match("SAAAM_KEYWORD", "vec2")) {
      this.consume();
      this.consume("PUNCTUATION", "(");
      const x = this.parseExpression();
      this.consume("PUNCTUATION", ",");
      const y = this.parseExpression();
      this.consume("PUNCTUATION", ")");

      return {
        type: "Vec2Expression",
        x,
        y,
      };
    }

    if (this.match("SAAAM_KEYWORD", "vec3")) {
      this.consume();
      this.consume("PUNCTUATION", "(");
      const x = this.parseExpression();
      this.consume("PUNCTUATION", ",");
      const y = this.parseExpression();
      this.consume("PUNCTUATION", ",");
      const z = this.parseExpression();
      this.consume("PUNCTUATION", ")");

      return {
        type: "Vec3Expression",
        x,
        y,
        z,
      };
    }

    if (this.match("IDENTIFIER")) {
      const identifier = this.consume("IDENTIFIER").value;
      
      // Check if identifier is predefined in SAAAM
      const isPredefinedVar = this.predefinedVariables.includes(identifier);
      const isPredefinedFunc = this.predefinedFunctions.includes(identifier);
      
      return {
        type: "Identifier",
        name: identifier,
        isPredefined: isPredefinedVar || isPredefinedFunc
      };
    }

    if (this.match("NUMBER")) {
      return {
        type: "Literal",
        value: Number.parseFloat(this.consume("NUMBER").value),
      };
    }

    if (this.match("STRING")) {
      // Remove the quotes
      const str = this.consume("STRING").value;
      return {
        type: "Literal",
        value: str.substring(1, str.length - 1),
        raw: str
      };
    }

    if (this.match("KEYWORD", "true")) {
      this.consume();
      return {
        type: "Literal",
        value: true,
      };
    }

    if (this.match("KEYWORD", "false")) {
      this.consume();
      return {
        type: "Literal",
        value: false,
      };
    }

    if (this.match("KEYWORD", "null")) {
      this.consume();
      return {
        type: "Literal",
        value: null,
      };
    }

    if (this.match("KEYWORD", "undefined")) {
      this.consume();
      return {
        type: "Identifier",
        name: "undefined"
      };
    }

    if (this.match("BRACKET", "{")) {
      return this.parseObjectLiteral();
    }

    if (this.match("BRACKET", "[")) {
      return this.parseArrayLiteral();
    }

    if (this.match("PUNCTUATION", "(")) {
      this.consume();
      const expr = this.parseExpression();
      this.consume("PUNCTUATION", ")");
      return expr;
    }

    this.addError(`Unexpected token: ${this.peek().value}`);
    throw new Error(`Unexpected token: ${this.peek().value}`);
  }

  /**
   * Check if the current token matches the given criteria
   * @param type - The token type to match
   * @param value - The token value to match (optional)
   * @returns Whether the token matches
   */
  private match(type: string, value?: string): boolean {
    const token = this.peek();

    if (token.type !== type) {
      return false;
    }

    if (value !== undefined && token.value !== value) {
      return false;
    }

    return true;
  }

  /**
   * Peek at the current token without consuming it
   * @returns The current token
   */
  private peek(): Token {
    return this.tokens[this.currentToken];
  }

  /**
   * Consume the current token and advance
   * @param type - Expected token type (optional)
   * @param value - Expected token value (optional)
   * @returns The consumed token
   */
  private consume(type?: string, value?: string): Token {
    const token = this.peek();

    if (type !== undefined && token.type !== type) {
      this.addError(`Expected token of type ${type}, but got ${token.type}`);
      throw new Error(`Expected token of type ${type}, but got ${token.type}`);
    }

    if (value !== undefined && token.value !== value) {
      this.addError(`Expected token with value ${value}, but got ${token.value}`);
      throw new Error(`Expected token with value ${value}, but got ${token.value}`);
    }

    this.currentToken++;
    return token;
  }

  /**
   * Generate JavaScript code from the AST
   * @returns The compiled JavaScript code
   */
  generate(): string {
    if (!this.ast) {
      return "// No AST to generate code from";
    }
    
    return this.generateNode(this.ast);
  }

  /**
   * Generate JavaScript code for a specific AST node
   * @param node - The AST node
   * @returns The compiled JavaScript code for this node
   */
  private generateNode(node: ASTNode): string {
    switch (node.type) {
      case "Program":
        return node.body.map((stmt: ASTNode) => this.generateNode(stmt)).join("\n");

      case "VariableDeclaration": {
        let code = `${node.kind} ${node.identifier}`;
        if (node.init) {
          code += ` = ${this.generateNode(node.init)}`;
        }
        return code + ";";
      }

      case "FunctionDefinition": {
        let code = `function ${node.name}(${node.params.join(", ")}) `;
        code += this.generateNode(node.body);
        return code;
      }

      case "Block": {
        const inner = node.statements.map((stmt: ASTNode) => this.generateNode(stmt)).join("\n");
        return `{
${this.indent(inner)}
}`;
      }

      case "ExpressionStatement":
        return this.generateNode(node.expression) + ";";

      case "IfStatement": {
        let code = `if (${this.generateNode(node.condition)}) ${this.generateNode(node.consequent)}`;
        if (node.alternate) {
          code += ` else ${this.generateNode(node.alternate)}`;
        }
        return code;
      }

      case "ForLoop": {
        let initStr = node.init ? this.generateNode(node.init) : "";
        if (node.init && node.init.type !== "VariableDeclaration") {
          initStr += ";";
        }
        
        let condStr = node.condition ? this.generateNode(node.condition) : "true";
        let updateStr = node.update ? this.generateNode(node.update) : "";
        
        return `for (${initStr} ${condStr}; ${updateStr}) ${this.generateNode(node.body)}`;
      }

      case "WhileLoop": {
        return `while (${this.generateNode(node.condition)}) ${this.generateNode(node.body)}`;
      }

      case "DoWhileLoop": {
        return `do ${this.generateNode(node.body)} while (${this.generateNode(node.condition)});`;
      }

      case "SwitchStatement": {
        let code = `switch (${this.generateNode(node.discriminant)}) {\n`;
        
        for (const caseNode of node.cases) {
          if (caseNode.test === null) {
            code += `default:\n`;
          } else {
            code += `case ${this.generateNode(caseNode.test)}:\n`;
          }
          
          for (const stmt of caseNode.consequent) {
            code += this.indent(this.generateNode(stmt)) + "\n";
          }
        }
        
        code += "}";
        return code;
      }

      case "ReturnStatement": {
        return node.argument ? `return ${this.generateNode(node.argument)};` : "return;";
      }

      case "BreakStatement": {
        return "break;";
      }

      case "ContinueStatement": {
        return "continue;";
      }

      case "EmptyStatement": {
        return ";";
      }

      case "AssignmentExpression": {
        return `${this.generateNode(node.left)} ${node.operator} ${this.generateNode(node.right)}`;
      }

      case "BinaryExpression": {
        return `${this.generateNode(node.left)} ${node.operator} ${this.generateNode(node.right)}`;
      }

      case "UnaryExpression": {
        return `${node.operator}${this.generateNode(node.argument)}`;
      }

      case "CallExpression": {
        const args = node.arguments.map((arg: ASTNode) => this.generateNode(arg)).join(", ");
        return `${this.generateNode(node.callee)}(${args})`;
      }

      case "MemberExpression": {
        if (node.computed) {
          return `${this.generateNode(node.object)}[${this.generateNode(node.property)}]`;
        }
        return `${this.generateNode(node.object)}.${node.property}`;
      }

      case "ThisExpression": {
        return "this";
      }

      case "Vec2Expression": {
        // Translate vec2 to an object creation
        return `{ x: ${this.generateNode(node.x)}, y: ${this.generateNode(node.y)} }`;
      }

      case "Vec3Expression": {
        // Translate vec3 to an object creation
        return `{ x: ${this.generateNode(node.x)}, y: ${this.generateNode(node.y)}, z: ${this.generateNode(node.z)} }`;
      }

      case "ObjectExpression": {
        if (node.properties.length === 0) {
          return "{}";
        }
        
        const props = node.properties.map((prop: ASTNode) => {
          if (prop.computed) {
            return `[${this.generateNode(prop.key)}]: ${this.generateNode(prop.value)}`;
          }
          
          // Use the name property directly for identifiers
          const key = prop.key.type === "Identifier" ? prop.key.name : `"${prop.key.value}"`;
          return `${key}: ${this.generateNode(prop.value)}`;
        }).join(", ");
        
        return `{ ${props} }`;
      }

      case "ArrayExpression": {
        const elements = node.elements.map((element: ASTNode | null) => 
          element === null ? "" : this.generateNode(element)
        ).join(", ");
        
        return `[${elements}]`;
      }

      case "Identifier": {
        // Special handling for SAAAM identifiers that need conversion
        switch (node.name) {
          case "keyboard_check":
            return "SAAAM.keyboardCheck";
          case "keyboard_check_pressed":
            return "SAAAM.keyboardCheckPressed";
          case "keyboard_check_released":
            return "SAAAM.keyboardCheckReleased";
          case "draw_sprite":
            return "SAAAM.drawSprite";
          case "draw_text":
            return "SAAAM.drawText";
          case "draw_rectangle":
            return "SAAAM.drawRectangle";
          case "draw_circle":
            return "SAAAM.drawCircle";
          case "draw_line":
            return "SAAAM.drawLine";
          case "play_sound":
            return "SAAAM.playSound";
          case "play_music":
            return "SAAAM.playMusic";
          case "check_collision":
            return "SAAAM.checkCollision";
          case "point_distance":
            return "SAAAM.pointDistance";
          case "delta_time":
            return "SAAAM.deltaTime";
          case "current_time":
            return "SAAAM.currentTime";
          case "vk_left":
            return "SAAAM.vk.left";
          case "vk_right":
            return "SAAAM.vk.right";
          case "vk_up":
            return "SAAAM.vk.up";
          case "vk_down":
            return "SAAAM.vk.down";
          case "vk_space":
            return "SAAAM.vk.space";
          case "vk_enter":
            return "SAAAM.vk.enter";
          case "vk_escape":
            return "SAAAM.vk.escape";
          case "vk_shift":
            return "SAAAM.vk.shift";
          // Add other vk_* keys as needed
          default:
            return node.name;
        }
      }

      case "Literal": {
        if (typeof node.value === "string") {
          return `"${node.value.replace(/"/g, '\\"')}"`;
        } else if (node.value === null) {
          return "null";
        } else {
          return node.value.toString();
        }
      }

      default:
        this.addWarning(`Unknown node type for code generation: ${node.type}`);
        return `/* Unknown node type: ${node.type} */`;
    }
  }

  /**
   * Add indentation to the given code
   * @param code - The code to indent
   * @returns The indented code
   */
  private indent(code: string): string {
    return code
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");
  }

  /**
   * Perform static analysis on the AST to find common issues
   */
  private analyzeCode(): void {
    if (!this.ast) return;
    
    const variableUsage: Map<string, { declared: boolean, used: boolean }> = new Map();
    
    // Recursive visitor function
    const visit = (node: ASTNode): void => {
      switch (node.type) {
        case "VariableDeclaration":
          if (variableUsage.has(node.identifier)) {
            const usage = variableUsage.get(node.identifier)!;
            if (usage.declared) {
              this.addWarning(`Variable '${node.identifier}' is already declared`);
            }
            usage.declared = true;
          } else {
            variableUsage.set(node.identifier, { declared: true, used: false });
          }
          
          if (node.init) visit(node.init);
          break;
          
        case "FunctionDefinition":
          // Function parameters
          for (const param of node.params) {
            variableUsage.set(param, { declared: true, used: false });
          }
          
          visit(node.body);
          break;
          
        case "Identifier":
          // Skip predefined identifiers
          if (this.predefinedVariables.includes(node.name) || 
              this.predefinedFunctions.includes(node.name)) {
            break;
          }
          
          if (variableUsage.has(node.name)) {
            const usage = variableUsage.get(node.name)!;
            usage.used = true;
          } else {
            variableUsage.set(node.name, { declared: false, used: true });
          }
          break;
          
        // Recursive cases for other node types
        case "Program":
          for (const child of node.body) {
            visit(child);
          }
          break;
          
        case "Block":
          for (const stmt of node.statements) {
            visit(stmt);
          }
          break;
          
        // Add other node types as needed...
        default:
          // Generic recursive traversal for other node types
          for (const key in node) {
            if (node.hasOwnProperty(key) && typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                  if (item && typeof item === 'object' && item.type) {
                    visit(item);
                  }
                }
              } else if (node[key].type) {
                visit(node[key]);
              }
            }
          }
      }
    };
    
    // Start traversal from the root
    visit(this.ast);
    
    // Check for unused variables
    for (const [name, usage] of variableUsage.entries()) {
      if (usage.declared && !usage.used) {
        this.addWarning(`Variable '${name}' is declared but never used`);
      }
      
      if (!usage.declared && usage.used) {
        // Skip global/built-in variables
        if (!this.predefinedVariables.includes(name) && 
            !this.predefinedFunctions.includes(name)) {
          this.addWarning(`Variable '${name}' is used but not declared`);
        }
      }
    }
  }

  /**
   * Perform optimization passes on the AST
   */
  private optimizeCode(): void {
    // Future implementation for code optimization
    // - Constant folding
    // - Dead code elimination
    // - Loop optimizations
  }

  /**
   * Compile SAAAM code to JavaScript
   * @param code - The SAAAM code to compile
   * @returns Result with success flag and any errors/warnings
   */
  compile(code: string): { 
    success: boolean; 
    js?: string;
    errors: string[]; 
    warnings: string[];
    ast?: ASTNode | null;
  } {
    this.reset();
    
    try {
      // Tokenize the code
      this.tokenize(code);
      
      // Parse the tokens into an AST
      this.ast = this.parse();
      
      // Analyze the AST for common issues
      this.analyzeCode();
      
      // Optimize the AST
      this.optimizeCode();
      
      // Generate the JavaScript code
      const js = this.generate();
      
      return {
        success: this.errors.length === 0,
        js,
        errors: this.errors,
        warnings: this.warnings,
        ast: this.ast
      };
    } catch (error) {
      if (error instanceof Error) {
        this.addError(`Compilation error: ${error.message}`);
      } else {
        this.addError(`Compilation error: ${String(error)}`);
      }
      
      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
        ast: this.ast
      };
    }
  }

  /**
   * Compile SAAAM code to JavaScript with full output
   * @param code - The SAAAM code to compile
   * @returns The compiled JavaScript code with SAAAM runtime wrapper
   */
  compileToJS(code: string): string {
    const result = this.compile(code);
    
    if (!result.success) {
      return `// Compilation failed with errors:
// ${result.errors.join('\n// ')}`;
    }
    
    // Add wrapper to provide SAAAM environment
    const compiledCode = result.js || '';

    return `
// Compiled SAAAM code
(function(SAAAM) {
${this.indent(compiledCode)}

// Register lifecycle functions with SAAAM engine
if (typeof create === 'function') SAAAM.registerCreate(create);
if (typeof step === 'function') SAAAM.registerStep(step);
if (typeof draw === 'function') SAAAM.registerDraw(draw);
if (typeof on_collision === 'function') SAAAM.registerCollision(on_collision);

})(SAAAM || {});
`;
  }
}
