# Personal Site

---

A site I made to quickly access school links, along with my LLM wrapper. 
Rewritten from Svelte to React. The auth system is pretty rudimentary but it gets the job done.

### Learning Experiences
- General React state knowledge
- Client/server sides, backend with Cloudflare Functions


### Tricky problems
- My cookie parsing was failing due to a check on cookies.length. This only occured on Safari, which led me down a bit of a red herring chase.
- CSS scoping. In React, CSS can leak out to other pages. Solved using css modules


**Chat page:**
![image](https://github.com/user-attachments/assets/549f732d-abf8-44ea-a179-178022b4f5f5)
