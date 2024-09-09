// middleware/animationGuard.js
export default function (context) {
    return new Promise((resolve) => {
      alert('transition');
  
      // Assume your animation takes 500ms
      setTimeout(() => {
        resolve(); // Resolve the navigation after animation is done
      }, 3000); // Match this delay with your animation duration
    });
  }
  