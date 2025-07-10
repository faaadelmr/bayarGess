import Image from 'next/image';
import logo from '../../public/logo.png'; // Adjust the path as needed

export const Logo = () => {
  return (
    <div className="flex items-center justify-center">
      <Image
        src={logo}
        alt="App Logo"
        width={40} // Adjust width and height as needed
        height={40}
      />
    </div>
  );
};
