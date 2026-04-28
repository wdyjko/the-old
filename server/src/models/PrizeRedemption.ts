import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class PrizeRedemption extends Model {
  declare id: number;
  declare userId: number;
  declare prizeName: string;
  declare cost: number;
  declare targetPhone: string;
  declare status: 'pending' | 'shipped';
}

PrizeRedemption.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    prizeName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    cost: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    targetPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'shipped'),
      defaultValue: 'pending',
    },
  },
  {
    tableName: 'prize_redemptions',
    sequelize,
    timestamps: true,
  }
);
