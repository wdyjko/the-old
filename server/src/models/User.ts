import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class User extends Model {
  declare id: number;
  declare phone: string;
  declare password: string;
  declare role: 'elderly' | 'volunteer' | 'admin';
  declare name: string;
  declare idCard: string;
  declare points: number;
  declare status: 'pending' | 'active' | 'disabled';
  declare address: string | null;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('elderly', 'volunteer', 'admin'),
      allowNull: false,
      defaultValue: 'elderly',
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    idCard: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'disabled'),
      defaultValue: 'pending', // Volunteers need approval
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    sequelize,
    timestamps: true,
  }
);
