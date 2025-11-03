export interface User {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  picture?: string;
  role: number; // 1 - režiser, 2 - glumac, 3 - snimatelj, 4 - scenograf, 5 - montazer
}
