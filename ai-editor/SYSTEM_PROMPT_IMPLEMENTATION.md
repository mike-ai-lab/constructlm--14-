# System Prompt Implementation

## Overview

A concise, efficient system prompt has been embedded in the server to guide the AI model to generate valid, working React code without bloating user requests.

## What Changed

### Before
- User requests had to include 400+ lines of guidelines
- Guidelines repeated in every request
- Inefficient token usage
- Poor user experience

### After
- System prompt embedded in server (once)
- Sent with every AI request automatically
- Concise and efficient
- No user overhead

## System Prompt Content

The prompt is stored in `server.js` as `SYSTEM_PROMPT` constant and includes:

### Critical Constraints (7 rules)
1. Always export default React component
2. Only return valid JSX
3. Use inline styles only
4. Use only React hooks
5. Use CORS-enabled image URLs
6. Initialize all state with values
7. No async/await in render

### Valid Component Template
Shows the exact pattern to follow

### Image URLs That Work
Lists reliable sources (Unsplash, placeholder services)

### Common Errors to Avoid
Shows what NOT to do with examples

### Patch Format
For semantic patch requests

## Implementation

### Endpoints Updated

1. **`/semantic-patch`** - Uses system prompt
   ```javascript
   messages: [
     { role: 'system', content: SYSTEM_PROMPT },
     { role: 'user', content: context }
   ]
   ```

2. **`/edit`** - Uses system prompt
   ```javascript
   messages: [
     { role: 'system', content: SYSTEM_PROMPT },
     { role: 'user', content: prompt }
   ]
   ```

## Benefits

✅ **Efficient**
- System prompt sent once per request
- No duplication
- Minimal token overhead (~200 tokens)

✅ **Effective**
- AI understands constraints clearly
- Generates valid code consistently
- Reduces errors and bugs

✅ **Scalable**
- Easy to update prompt in one place
- Changes apply to all requests
- No user-side changes needed

✅ **User-Friendly**
- Users don't see the prompt
- Requests stay concise
- Better experience

## Expected Results

### Before System Prompt
```
User: "Create a carousel"
AI: ❌ Returns object instead of JSX
Error: React error #130
```

### After System Prompt
```
User: "Create a carousel"
AI: ✅ Returns valid JSX component
Result: Works perfectly in preview
```

## Testing

To verify the system prompt is working:

1. **Request a component:** "Create a carousel with 4 images"
2. **Check the result:**
   - ✅ Component exports default
   - ✅ Returns JSX (not object/string)
   - ✅ Uses inline styles
   - ✅ Images load correctly
   - ✅ No console errors

3. **Request a modification:** "Add parallax effect to carousel"
4. **Check the result:**
   - ✅ Returns patches in correct format
   - ✅ Only modifies relevant lines
   - ✅ Maintains valid JSX

## System Prompt Details

### Size
- ~400 words
- ~200 tokens
- Minimal overhead

### Coverage
- React component structure
- Styling approach
- Image handling
- State management
- Error prevention
- Patch format

### Clarity
- Clear constraints
- Valid examples
- Invalid examples
- Common mistakes

## Future Improvements

1. **Add more examples** - More component patterns
2. **Add performance tips** - Optimization guidelines
3. **Add accessibility** - ARIA attributes
4. **Add testing** - How to make testable components
5. **Add documentation** - JSDoc comments

## Files Modified

- `server.js` - Added SYSTEM_PROMPT constant and integrated into both endpoints

## Files Created

- `SYSTEM_PROMPT_IMPLEMENTATION.md` - This file

## Backward Compatibility

✅ **Fully compatible**
- No breaking changes
- Existing code still works
- Only improves AI output quality

## Conclusion

The system prompt is now embedded in the server and automatically guides the AI to generate valid, working React code for every request. This eliminates the need to send guidelines with each request while ensuring consistent, high-quality output.

**Result: Better code quality, better user experience, better efficiency!** 🚀
