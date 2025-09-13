import Link from "next/link";

interface FooterProps {
  variant?: 'default' | 'dark' | 'light' | 'gradient' | 'minimal';
  className?: string;
}

export function Footer({ variant = 'default', className = '' }: FooterProps) {
  const getFooterStyles = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16';
      case 'dark':
        return 'bg-gray-900 text-white py-12';
      case 'light':
        return 'bg-gray-50 py-12';
      case 'minimal':
        return 'bg-white border-t border-gray-200 py-8 mt-12';
      case 'default':
      default:
        return 'bg-gray-900 text-white py-16';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'light':
        return {
          title: 'text-blue-600',
          subtitle: 'text-gray-600',
          links: 'text-gray-500 hover:text-blue-600',
          copyright: 'text-gray-400'
        };
      case 'minimal':
        return {
          title: 'text-blue-600',
          subtitle: 'text-gray-600 text-sm',
          links: 'text-gray-500 hover:text-blue-600',
          copyright: 'text-gray-400'
        };
      case 'gradient':
        return {
          title: 'text-blue-400 hover:text-blue-300',
          subtitle: 'text-gray-300',
          links: 'text-gray-300 hover:text-blue-400',
          copyright: 'text-gray-400'
        };
      case 'dark':
      case 'default':
      default:
        return {
          title: 'text-white',
          subtitle: 'text-gray-300',
          links: 'text-gray-400 hover:text-white',
          copyright: 'text-gray-400'
        };
    }
  };

  const styles = getTextStyles();
  const isGradient = variant === 'gradient';
  const isMinimal = variant === 'minimal';

  return (
    <footer className={`${getFooterStyles()} ${className}`}>
      <div className="container mx-auto px-6">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <div className={`${isMinimal ? 'text-xl' : 'text-2xl'} ${isGradient ? 'text-3xl' : ''} font-bold ${styles.title} mb-${isMinimal ? '2' : '4'} ${isGradient ? 'mb-6' : ''} transition-colors`}>
              🤖 AI Tóm tắt
            </div>
          </Link>
          
          <p className={`${styles.subtitle} mb-6 ${isGradient ? 'text-lg max-w-2xl mx-auto mb-8' : ''} ${isMinimal ? 'mb-0' : ''}`}>
            Công cụ AI đa năng {isGradient ? 'giúp ' : 'cho '}sinh viên và nhân viên văn phòng Việt Nam{isGradient ? ' tiết kiệm thời gian mỗi ngày' : ''}
          </p>
          
          {!isMinimal && (
            <div className={`flex justify-center space-x-6 text-sm ${styles.links} ${isGradient ? 'space-x-8 mb-8' : ''}`}>
              <Link href="/privacy" className="hover:transition-colors">
                Chính sách bảo mật
              </Link>
              <Link href="/terms" className="hover:transition-colors">
                Điều khoản sử dụng
              </Link>
              <Link href="/contact" className="hover:transition-colors">
                Liên hệ
              </Link>
            </div>
          )}
          
          {isGradient && (
            <div className="border-t border-gray-700 pt-8">
              <p className={`${styles.copyright} text-sm`}>
                © 2025 AI Tóm tắt. Made with ❤️ in Vietnam.
              </p>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}