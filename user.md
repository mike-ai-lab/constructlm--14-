10:48:17.286 cerebrasService.ts:100  POST https://api.cerebras.ai/v1/chat/completions 404 (Not Found)
streamChatResponse @ cerebrasService.ts:100
handleSendMessage @ App.tsx:376
await in handleSendMessage
handleSubmit @ ChatInterface.tsx:254
executeDispatch @ react-dom-client.development.js:19116
runWithFiberInDEV @ react-dom-client.development.js:871
processDispatchQueue @ react-dom-client.development.js:19166
(anonymous) @ react-dom-client.development.js:19767
batchedUpdates$1 @ react-dom-client.development.js:3255
dispatchEventForPluginEventSystem @ react-dom-client.development.js:19320
dispatchEvent @ react-dom-client.development.js:23585
dispatchDiscreteEvent @ react-dom-client.development.js:23553
<form>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:335
ChatInterface @ ChatInterface.tsx:784
react_stack_bottom_frame @ react-dom-client.development.js:25904
renderWithHooksAgain @ react-dom-client.development.js:7762
renderWithHooks @ react-dom-client.development.js:7674
updateFunctionComponent @ react-dom-client.development.js:10166
beginWork @ react-dom-client.development.js:11778
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:18957
performWorkUntilDeadline @ scheduler.development.js:45
<ChatInterface>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:335
App @ App.tsx:747
react_stack_bottom_frame @ react-dom-client.development.js:25904
renderWithHooksAgain @ react-dom-client.development.js:7762
renderWithHooks @ react-dom-client.development.js:7674
updateFunctionComponent @ react-dom-client.development.js:10166
beginWork @ react-dom-client.development.js:11778
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:18957
performWorkUntilDeadline @ scheduler.development.js:45
<App>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:335
(anonymous) @ index.tsx:13
10:48:17.320 installHook.js:1 Cerebras API error details: {"message":"Model glm-4-9b does not exist or you do not have access to it.","type":"not_found_error","param":"model","code":"model_not_found"}
overrideMethod @ installHook.js:1
streamChatResponse @ cerebrasService.ts:118
await in streamChatResponse
handleSendMessage @ App.tsx:376
await in handleSendMessage
handleSubmit @ ChatInterface.tsx:254
executeDispatch @ react-dom-client.development.js:19116
runWithFiberInDEV @ react-dom-client.development.js:871
processDispatchQueue @ react-dom-client.development.js:19166
(anonymous) @ react-dom-client.development.js:19767
batchedUpdates$1 @ react-dom-client.development.js:3255
dispatchEventForPluginEventSystem @ react-dom-client.development.js:19320
dispatchEvent @ react-dom-client.development.js:23585
dispatchDiscreteEvent @ react-dom-client.development.js:23553
<form>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:335
ChatInterface @ ChatInterface.tsx:784
react_stack_bottom_frame @ react-dom-client.development.js:25904
renderWithHooksAgain @ react-dom-client.development.js:7762
renderWithHooks @ react-dom-client.development.js:7674
updateFunctionComponent @ react-dom-client.development.js:10166
beginWork @ react-dom-client.development.js:11778
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:18957
performWorkUntilDeadline @ scheduler.development.js:45
<ChatInterface>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:335
App @ App.tsx:747
react_stack_bottom_frame @ react-dom-client.development.js:25904
renderWithHooksAgain @ react-dom-client.development.js:7762
renderWithHooks @ react-dom-client.development.js:7674
updateFunctionComponent @ react-dom-client.development.js:10166
beginWork @ react-dom-client.development.js:11778
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:18957
performWorkUntilDeadline @ scheduler.development.js:45
<App>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:335
(anonymous) @ index.tsx:13
10:48:17.321 installHook.js:1 Chat Error Error: Cerebras API error (404):  - {"message":"Model glm-4-9b does not exist or you do not have access to it.","type":"not_found_error","param":"model","code":"model_not_found"}
    at Module.streamChatResponse (cerebrasService.ts:119:11)
    at async handleSendMessage (App.tsx:376:7)
overrideMethod @ installHook.js:1
handleSendMessage @ App.tsx:416
await in handleSendMessage
handleSubmit @ ChatInterface.tsx:254
executeDispatch @ react-dom-client.development.js:19116
runWithFiberInDEV @ react-dom-client.development.js:871
processDispatchQueue @ react-dom-client.development.js:19166
(anonymous) @ react-dom-client.development.js:19767
batchedUpdates$1 @ react-dom-client.development.js:3255
dispatchEventForPluginEventSystem @ react-dom-client.development.js:19320
dispatchEvent @ react-dom-client.development.js:23585
dispatchDiscreteEvent @ react-dom-client.development.js:23553
<form>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:335
ChatInterface @ ChatInterface.tsx:784
react_stack_bottom_frame @ react-dom-client.development.js:25904
renderWithHooksAgain @ react-dom-client.development.js:7762
renderWithHooks @ react-dom-client.development.js:7674
updateFunctionComponent @ react-dom-client.development.js:10166
beginWork @ react-dom-client.development.js:11778
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:18957
performWorkUntilDeadline @ scheduler.development.js:45
<ChatInterface>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:335
App @ App.tsx:747
react_stack_bottom_frame @ react-dom-client.development.js:25904
renderWithHooksAgain @ react-dom-client.development.js:7762
renderWithHooks @ react-dom-client.development.js:7674
updateFunctionComponent @ react-dom-client.development.js:10166
beginWork @ react-dom-client.development.js:11778
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:18957
performWorkUntilDeadline @ scheduler.development.js:45
<App>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:335
(anonymous) @ index.tsx:13


data
----
{@{id=openai/gpt-5.4-pro; canonical_slug=openai/gpt-5.4-pro...
