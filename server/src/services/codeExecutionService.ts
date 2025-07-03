import ivm from 'isolated-vm';
import logger from '../utils/logger';

export class CodeExecutionService {
  private readonly executionTimeoutMs: number = 5000; // 5 second timeout
  private readonly memoryLimitMb: number = 128;       // 128MB memory limit
  
  async executeJavaScript(code: string): Promise<{ 
    output: string | null; 
    error: string | null; 
    executionTime: number 
  }> {
    const startTime = Date.now();
    let output: string | null = null;
    let error: string | null = null;
    
    try {
      // Create a new isolate with memory limit
      const isolate = new ivm.Isolate({ memoryLimit: this.memoryLimitMb });
      
      // Create a new context within this isolate
      const context = await isolate.createContext();
      
      // Get a reference to the global object within the context
      const jail = context.global;
      
      // Set up console.log to capture output
      let capturedOutput = '';
      await jail.set('log', function(...args: any[]) {
        capturedOutput += args.join(' ') + '\n';
      });
      
      // Set up console.error to capture errors
      let capturedErrors = '';
      await jail.set('error', function(...args: any[]) {
        capturedErrors += 'ERROR: ' + args.join(' ') + '\n';
      });
      
      // Create console object in the isolated context
      await context.eval(`
        global.console = {
          log: log,
          error: error,
          warn: error,
          info: log
        };
      `);
      
      // Execute the user's code with timeout
      const script = await isolate.compileScript(code);
      const result = await script.run(context, { timeout: this.executionTimeoutMs });
      
      // Capture the output
      output = capturedOutput || '';
      if (capturedErrors) {
        error = capturedErrors;
      }
      
      // If there's a return value, add it to output
      if (result !== undefined && result !== null) {
        output += String(result);
      }
      
      // Clean up
      isolate.dispose();
      
    } catch (err: any) {
      // Handle execution errors
      if (err.message?.includes('Script execution timed out')) {
        error = 'Code execution timed out after 5 seconds. Please check for infinite loops.';
      } else if (err.message?.includes('Array buffer allocation failed')) {
        error = 'Code execution exceeded memory limit. Please optimize your code.';
      } else {
        error = this.formatJavaScriptError(err.message || 'Unknown execution error');
      }
    }
    
    const executionTime = Date.now() - startTime;
    logger.debug(`JavaScript execution completed in ${executionTime}ms`);
    
    return {
      output: output || null,
      error: error || null,
      executionTime
    };
  }

  private formatJavaScriptError(error: string): string {
    // Clean up error messages for better user experience
    error = error.replace(/at eval \(eval at <anonymous>.*/g, '');
    error = error.replace(/at <anonymous>:\d+:\d+/g, '');
    error = error.replace(/\s+/g, ' ').trim();
    
    // Add helpful context for common errors
    if (error.includes('ReferenceError')) {
      error += '\n\nTip: Make sure all variables are declared before use.';
    } else if (error.includes('SyntaxError')) {
      error += '\n\nTip: Check for missing brackets, quotes, or semicolons.';
    } else if (error.includes('TypeError')) {
      error += '\n\nTip: Check that you\'re calling methods on the correct data types.';
    }
    
    return error;
  }
}

// Export singleton instance
export const codeExecutionService = new CodeExecutionService();
