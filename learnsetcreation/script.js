document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("a");
  links.forEach(link => {
    link.addEventListener("mouseover", () => {
      link.style.textDecoration = "underline";
    });
    link.addEventListener("mouseout", () => {
      link.style.textDecoration = "none";
    });
  });
});
