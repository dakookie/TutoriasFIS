import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
  ) {}

  async crear(createUsuarioDto: CreateUsuarioDto): Promise<UsuarioDocument> {
    const existente = await this.usuarioModel.findOne({ 
      email: createUsuarioDto.email 
    });
    
    if (existente) {
      throw new ConflictException('El email ya está registrado');
    }

    const usuario = new this.usuarioModel(createUsuarioDto);
    return usuario.save();
  }

  async findAll(filtros?: { rol?: string; activo?: boolean }): Promise<UsuarioDocument[]> {
    const query: any = {};
    
    if (filtros?.rol) {
      query.rol = filtros.rol;
    }
    
    if (filtros?.activo !== undefined) {
      query.activo = filtros.activo;
    }

    return this.usuarioModel
      .find(query)
      .select('-password')
      .populate('materias', 'nombre codigo semestre')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<UsuarioDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const usuario = await this.usuarioModel
      .findById(id)
      .select('-password')
      .populate('materias', 'nombre codigo semestre')
      .exec();

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async findByEmail(email: string): Promise<UsuarioDocument | null> {
    return this.usuarioModel.findOne({ email }).populate('materias', 'nombre codigo semestre').exec();
  }

  async findTutores(): Promise<UsuarioDocument[]> {
    return this.usuarioModel
      .find({ rol: 'tutor', activo: true })
      .select('-password')
      .sort({ nombre: 1 })
      .exec();
  }

  async findEstudiantes(): Promise<UsuarioDocument[]> {
    return this.usuarioModel
      .find({ rol: 'estudiante', activo: true })
      .select('-password')
      .sort({ nombre: 1 })
      .exec();
  }

  async actualizar(id: string, updateDto: UpdateUsuarioDto): Promise<UsuarioDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    // Si se intenta cambiar el email, verificar que no exista
    if (updateDto.email) {
      const existente = await this.usuarioModel.findOne({ 
        email: updateDto.email,
        _id: { $ne: id }
      });
      
      if (existente) {
        throw new ConflictException('El email ya está en uso');
      }
    }

    const usuario = await this.usuarioModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .select('-password')
      .populate('materias', 'nombre codigo semestre')
      .exec();

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async cambiarEstado(id: string, activo: boolean): Promise<UsuarioDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const usuario = await this.usuarioModel
      .findByIdAndUpdate(id, { activo }, { new: true })
      .select('-password')
      .populate('materias', 'nombre codigo semestre')
      .exec();

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async eliminar(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const resultado = await this.usuarioModel.findByIdAndDelete(id).exec();

    if (!resultado) {
      throw new NotFoundException('Usuario no encontrado');
    }
  }

  async contarPorRol(): Promise<{ estudiantes: number; tutores: number; admins: number }> {
    const [estudiantes, tutores, admins] = await Promise.all([
      this.usuarioModel.countDocuments({ rol: 'estudiante' }),
      this.usuarioModel.countDocuments({ rol: 'tutor' }),
      this.usuarioModel.countDocuments({ rol: 'admin' }),
    ]);

    return { estudiantes, tutores, admins };
  }
}
