import { CodePatch } from '../types';

/**
 * Apply block-based patches to code with strict validation
 */
export const applyPatches = (
  originalCode: string,
  patches: CodePatch[]
): { success: boolean; code?: string; errors?: string[] } => {
  
  const errors: string[] = [];
  let modifiedCode = originalCode;
  
  for (const patch of patches) {
    try {
      switch (patch.type) {
        
        case 'block_replace':
          if (!patch.oldCode || !patch.newCode) {
            errors.push(`block_replace patch missing oldCode or newCode`);
            continue;
          }
          
          // Strict matching: exact oldCode must exist
          const normalizedOld = patch.oldCode.trim();
          const normalizedCurrent = modifiedCode.trim();
          
          if (!normalizedCurrent.includes(normalizedOld)) {
            errors.push(
              `block_replace failed: oldCode not found in current code.\n` +
              `Looking for: ${normalizedOld.substring(0, 100)}...`
            );
            continue;
          }
          
          // Replace first occurrence (deterministic)
          modifiedCode = modifiedCode.replace(patch.oldCode, patch.newCode);
          break;
        
        case 'insert':
          if (!patch.newCode) {
            errors.push(`insert patch missing newCode`);
            continue;
          }
          
          // Insert at beginning if no oldCode specified
          if (!patch.oldCode) {
            modifiedCode = patch.newCode + '\n' + modifiedCode;
          } else {
            // Insert after oldCode
            if (!modifiedCode.includes(patch.oldCode)) {
              errors.push(`insert failed: oldCode anchor not found`);
              continue;
            }
            modifiedCode = modifiedCode.replace(
              patch.oldCode,
              patch.oldCode + '\n' + patch.newCode
            );
          }
          break;
        
        case 'delete':
          if (!patch.oldCode) {
            errors.push(`delete patch missing oldCode`);
            continue;
          }
          
          if (!modifiedCode.includes(patch.oldCode)) {
            errors.push(`delete failed: oldCode not found`);
            continue;
          }
          
          modifiedCode = modifiedCode.replace(patch.oldCode, '');
          break;
        
        case 'full_rewrite':
          if (!patch.newCode) {
            errors.push(`full_rewrite patch missing newCode`);
            continue;
          }
          return {
            success: true,
            code: patch.newCode
          };
        
        default:
          errors.push(`Unknown patch type: ${patch.type}`);
      }
    } catch (error) {
      errors.push(`Error applying patch: ${error}`);
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return {
    success: true,
    code: modifiedCode
  };
};

/**
 * Validate code with Babel before applying
 */
export const validateAndApply = async (
  originalCode: string,
  patches: CodePatch[],
  language: string
): Promise<{ success: boolean; code?: string; errors?: string[] }> => {
  
  const result = applyPatches(originalCode, patches);
  
  if (!result.success || !result.code) {
    return result;
  }
  
  // Validate with Babel
  try {
    const { transform } = await import('@babel/standalone');
    transform(result.code, {
      presets: ['react', 'typescript'],
      filename: `component.${language}`
    });
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      code: result.code,
      errors: [`Babel validation failed: ${error.message}`]
    };
  }
};

/**
 * Validate full code rewrite
 */
export const validateFullCode = async (
  code: string,
  language: string
): Promise<{ success: boolean; errors?: string[] }> => {
  try {
    const { transform } = await import('@babel/standalone');
    transform(code, {
      presets: ['react', 'typescript'],
      filename: `component.${language}`
    });
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      errors: [`Babel validation failed: ${error.message}`]
    };
  }
};
