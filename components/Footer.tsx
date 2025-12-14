export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
          <div>
            © 2025 MockOps. All rights reserved.
          </div>
          <div className="flex gap-6 items-center">
            <a href="https://angry-crustacean-d21.notion.site/MockOps-2c92c03f4c54804cb5f9fb49e0adbcd7?source=copy_link" className="hover:text-gray-900 transition-colors">이용약관</a>
            <a href="https://angry-crustacean-d21.notion.site/MockOps-2c92c03f4c54802895c4d83ab99500e4?source=copy_link" className="hover:text-gray-900 transition-colors">개인정보처리방침</a>
            <a href="mailto:contact.mockops@gmail.com" className="hover:text-gray-900 transition-colors">
              contact.mockops@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
