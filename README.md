# Personal Site


A site I made to quickly access school links, along with my LLM chatbot. Rewritten from Svelte to React.

I'm currently working on implementing streaming, so that I can see LLM responses in real-time as they arrive in chunks. I'm doing this using the JS Streams API.


### Learning Experiences
- General React state knowledge
- Client/server sides, backend with Cloudflare Functions
- Authentication using cookies
- Good UX designs, with me as the tester


### Tricky problems
- My cookie parsing was failing due to an extra cookie added by Cloudflare. This only occured on Safari, which led me down a bit of a red herring chase.
- CSS scoping. In React, CSS can leak out to other pages. Solved using css modules


**Chat page:**
<img width="1759" height="937" alt="image" src="https://github.com/user-attachments/assets/f0de8310-4e2d-4708-bf67-9a6374fafea7" />
